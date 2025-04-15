const express = require('express');
const router = express.Router();

// POST /deploy - manually trigger deployment
router.post('/', async (req, res) => {
  // TODO: Trigger ansible playbook
  res.json({ message: 'Deployment triggered (stub)' });
});

module.exports = router; 