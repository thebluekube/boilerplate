const { sendEmail } = require('./send');

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

module.exports = { sendJobNotification }; 