const express = require('express');
const router = express.Router();
const db = require('../db');
const scheduler = require('../scheduler');
const { sendEmail } = require('../email/send');
const { DEPLOY_ENVS } = require('../envs');

// GET /jobs - list all scheduled jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await db.getJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
  }
});

// GET /jobs/:id/logs - fetch logs for a job
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await db.getLogs(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs', details: err.message });
  }
});

function getJobEmail(job) {
  return process.env.EMAIL_TO || job.email || process.env.SMTP_USER || 'test@example.com';
}
function getSubjectPrefix() {
  return process.env.EMAIL_SUBJECT_PREFIX || '';
}
async function sendJobNotification(job, type, extra) {
  const to = getJobEmail(job);
  const prefix = getSubjectPrefix();
  let subject, text;
  switch (type) {
    case 'reminder':
      subject = `${prefix} Reminder: Job "${job.name}" scheduled for ${job.runAt}`;
      text = `This is a reminder that the job "${job.name}" is scheduled to run at ${job.runAt} in environment: ${job.envName || job.env}.`;
      break;
    case 'approved':
      subject = `${prefix} Job Approved: ${job.name}`;
      text = `${job.name} has been approved and will be deployed at ${job.runAt}.`;
      break;
    case 'denied':
      subject = `${prefix} Job Denied: ${job.name}`;
      text = `${job.name} has been denied.`;
      break;
    case 'success':
      subject = `${prefix} Job Success: ${job.name}`;
      text = `Job "${job.name}" ran successfully at ${extra?.runAt || job.lastRun} in environment: ${job.envName || job.env}.\nOutput:\n${extra?.output || ''}`;
      break;
    case 'failed':
      subject = `${prefix} Job Failed: ${job.name}`;
      text = `Job "${job.name}" failed at ${extra?.runAt || job.lastRun} in environment: ${job.envName || job.env}.\nOutput:\n${extra?.output || ''}`;
      break;
    default:
      subject = `${prefix} Job Notification: ${job.name}`;
      text = `Job "${job.name}" notification.`;
  }
  await sendEmail(to, subject, text);
}

// POST /jobs/:id/remind - send reminder email for a job
router.post('/:id/remind', async (req, res) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'scheduled') return res.status(400).json({ error: 'Cannot remind for a job that is not scheduled' });
    if (new Date(job.runAt) < new Date()) return res.status(400).json({ error: 'Cannot remind for a job in the past' });
    await sendJobNotification(job, 'reminder');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reminder', details: err.message });
  }
});

// POST /jobs - schedule new job
router.post('/', async (req, res) => {
  const { name, runAt, env } = req.body;
  if (!name || !runAt || !env) {
    return res.status(400).json({ error: 'Missing required fields: name, runAt, env' });
  }
  if (isNaN(Date.parse(runAt))) {
    return res.status(400).json({ error: 'Invalid runAt datetime' });
  }
  const envObj = DEPLOY_ENVS.find(e => e.key === env);
  if (!envObj) {
    return res.status(400).json({ error: 'Invalid environment selected' });
  }
  try {
    const result = await db.addJob({ name, runAt, env });
    await scheduler.reload();
    res.status(201).json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add job', details: err.message });
  }
});

// DELETE /jobs/:id - delete scheduled job
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.deleteJob(req.params.id);
    await scheduler.reload();
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: `Job ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job', details: err.message });
  }
});

// POST /jobs/:id/approve - approve a job
router.post('/:id/approve', async (req, res) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.decision !== 'pending') return res.status(400).json({ error: 'Job already decided' });
    await db.setJobDecision(req.params.id, 'approved');
    await scheduler.reload();
    await sendJobNotification(job, 'approved');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve job', details: err.message });
  }
});

// POST /jobs/:id/deny - deny a job
router.post('/:id/deny', async (req, res) => {
  try {
    const job = await db.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.decision !== 'pending') return res.status(400).json({ error: 'Job already decided' });
    await db.setJobDecision(req.params.id, 'denied');
    await scheduler.reload();
    await sendJobNotification(job, 'denied');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deny job', details: err.message });
  }
});

module.exports = router; 