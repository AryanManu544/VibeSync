const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: process.env.user,
    pass: process.env.password
  }
});

module.exports = transporter;
