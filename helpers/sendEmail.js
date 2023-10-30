const nodemailer = require('nodemailer');

require('dotenv').config();

const config = {
  host: 'smtp.ukr.net',
  port: 465,
  secure: true,
  auth: {
    user: process.env.UKR_NET_EMAIL,
    pass: process.env.UKR_NET_PASSWORD,
    },
  tls: {
    rejectUnauthorized: false,
  },
};

const transporter = nodemailer.createTransport(config);

const sendEmail = emailOptions => {
    const email = { ...emailOptions, from: process.env.UKR_NET_EMAIL };
    return transporter.sendMail(email)
};

module.exports = sendEmail