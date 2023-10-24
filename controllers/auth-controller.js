const { User } = require('../models/users');
const { HttpError, ctrlWrapper } = require('../helpers')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const fs = require('fs/promises');
const path = require('path');
const avatarPath = path.resolve('public', 'avatars')
const Jimp = require("jimp");

require('dotenv').config();

const gravatar = require('gravatar');

const {JWT_SECRET} = process.env;

const signup = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email })

    if (user) {
        throw HttpError(409, "Email in use")
    }
    const avatarURL = gravatar.url(`${email}`, {s: '250', r: 'pg', d: 'monsterid'});
    const hashPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({ ...req.body, avatarURL, password: hashPassword })
    res.status(201).json({
        "user": {
            email: newUser.email,
            subscription: newUser.subscription,
            avatarURL: newUser.avatar,
        }
    })
};

const signin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw HttpError(401, "Email or password is wrong")
    }

    const passwordCompare = await bcrypt.compare(password, user.password)
    if (!passwordCompare) {
        throw HttpError(401, "Email or password is wrong")
    }

    const payload = {
        id: user._id,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" })
    await User.findByIdAndUpdate(user._id, {token})

    res.json({
        token,
        "user": {
    "email": user.email,
    "subscription": user.subscription
  }
    })
};

const getCurrent = async (req, res) => {
    const { email, subscription } = req.user;

    res.json({ email, subscription });
};

const logout = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { token: "" })
    
    res.status(204).json()
};

const updateSubscription = async (req, res) => {
    const { _id: owner } = req.user
    const {subscription} = req.body
    if (subscription !== "starter" && subscription !== "pro" && subscription !== "business") {
        throw HttpError(400, 'right subscription status:"starter", "pro", "business"');
    }
    const result = await User.findOneAndUpdate({ _id: owner}, req.body, { new: true })
    if (!result) {
        throw HttpError(404, 'Not found')
    }
    res.json(result)
};

const updateAvatar = async (req, res) => {
    const { path: oldPath, filename } = req.file;
    const newPath = path.join(avatarPath, filename)
    await fs.rename(oldPath, newPath)
    Jimp.read(newPath, (err, avatar) => {
        if (err) throw err;
        avatar
        .resize(250, 250)
        .quality(60)
        .write(newPath);
    });
    const newAvatar = path.join('avatars', filename).replace(/\\/g, '/')
    const { _id: owner } = req.user
    const result = await User.findByIdAndUpdate({ _id: owner}, {avatarURL:newAvatar}, { new: true }, req.body)
    if (!result) {
        throw HttpError(404, 'Not found')
    }
    res.json({"avatarURL": result.avatarURL})
};

module.exports = {
    signup: ctrlWrapper(signup),
    signin: ctrlWrapper(signin),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar),
};