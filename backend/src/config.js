require('dotenv').config();

module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  remote: {
    ssh: {
      host: process.env.ANSIBLE_REMOTE_HOST,
      user: process.env.ANSIBLE_REMOTE_USER,
      key: process.env.ANSIBLE_REMOTE_KEY,
      port: process.env.ANSIBLE_REMOTE_PORT || 22,
    },
  },
}; 