const { sendEmail } = require('./send');

function getJobEmail(job) {
  return process.env.EMAIL_TO || job.email || process.env.SMTP_USER || 'test@example.com';
}
function getSubjectPrefix() {
  return process.env.EMAIL_SUBJECT_PREFIX || '';
}
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}
async function sendJobNotification(job, type, extra) {
  const to = getJobEmail(job);
  const prefix = getSubjectPrefix();
  let subject, text;
  switch (type) {
    case 'reminder':
      subject = `${prefix} Reminder: Job "${job.name}" scheduled for ${formatDate(job.runAt)}`;
      text = `This is a reminder that the job "${job.name}" is scheduled to run at ${formatDate(job.runAt)} in environment: ${job.envName || job.env}.`;
      break;
    case 'approved':
      subject = `${prefix} Job Approved: ${job.name}`;
      text = `${job.name} has been approved and will be deployed at ${formatDate(job.runAt)}.`;
      break;
    case 'denied':
      subject = `${prefix} Job Denied: ${job.name}`;
      text = `${job.name} has been denied.`;
      break;
    case 'success':
      subject = `${prefix} Job Success: ${job.name}`;
      subject += extra?.runAt ? ` at ${formatDate(extra.runAt)}` : '';
      text = `Job "${job.name}" ran successfully at ${formatDate(extra?.runAt || job.lastRun)} in environment: ${job.envName || job.env}.\nOutput:\n${extra?.output || ''}`;
      break;
    case 'failed':
      subject = `${prefix} Job Failed: ${job.name}`;
      subject += extra?.runAt ? ` at ${formatDate(extra.runAt)}` : '';
      text = `Job "${job.name}" failed at ${formatDate(extra?.runAt || job.lastRun)} in environment: ${job.envName || job.env}.\nOutput:\n${extra?.output || ''}`;
      break;
    default:
      subject = `${prefix} Job Notification: ${job.name}`;
      text = `Job "${job.name}" notification.`;
  }
  await sendEmail(to, subject, text);
}

module.exports = { sendJobNotification }; 