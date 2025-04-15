const nodemailer = require('nodemailer');
const config = require('../config');

async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: 25,
    secure: false, // port 25 is not secure
    auth: undefined, // no auth
    tls: { rejectUnauthorized: false }, // allow self-signed if needed
  });

  try {
    const info = await transporter.sendMail({
      from: config.smtp.user || 'noreply@example.com',
      to,
      subject,
      text,
    });
    return { success: true, info };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail }; 
