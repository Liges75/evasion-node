// ajout de la possibilité d'envoyer un email à l'utilisateur poen cas de mot de passe oublié avec module nodemailer

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true, // true pour 465, false pour 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;
