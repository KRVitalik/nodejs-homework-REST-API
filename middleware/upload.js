const multer = require('multer')
const {nanoid} = require('nanoid')
const path = require('path')

const destination = path.resolve('tmp')

const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
        const filename = `${nanoid()}_${file.originalname}`
        cb(null, filename)
    }
});

const limits = {
    fileSize: 5 * 1024 * 1024
}

const upload = multer({
    storage,
    limits,
})

module.exports = upload