const nodeMailer = require('nodemailer');

const { log } = require('./utilities');
const { MAIL_SERVICE } = require('../config');

// create mailer transport
const transporter = nodeMailer.createTransport({
  auth: {
    user: MAIL_SERVICE.email,
    pass: MAIL_SERVICE.password,
  },
  service: MAIL_SERVICE.service,
});

/**
 * Send an email with nodemailer
 * @param address {string} - target address
 * @param subject {string} - message subject
 * @param message {string} - message
 * @param files {*[]} - array of files
 * @returns {void}
 */
module.exports = (address = '', subject = '', message = '', files = []) => transporter.sendMail({
  from: MAIL_SERVICE.email,
  to: address,
  subject,
  html: message,
  attachments: files,
}, (error, response) => {
  if (error) return log('-- mailer: error', error);
  return log(`-- mailer: sent to ${address} (${response})`);
});
