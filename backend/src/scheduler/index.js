const schedule = require('node-schedule');
const db = require('../db');
const { sendEmail } = require('../email/send');
const { NodeSSH } = require('node-ssh');
const config = require('../config');
const { DEPLOY_ENVS } = require('../envs');

const scheduledTasks = new Map();

async function scheduleJob(job) {
  const runDate = new Date(job.runAt);
  if (isNaN(runDate.getTime()) || runDate < new Date()) {
    console.error(`Invalid or past runAt for job ${job.id}: ${job.runAt}`);
    return;
  }
  const task = schedule.scheduleJob(runDate, async () => {
    await runAndLogJob(job);
    scheduledTasks.delete(job.id);
  });
  scheduledTasks.set(job.id, task);
}

async function runAndLogJob(job) {
  const runAt = new Date().toISOString();
  let status = 'success';
  let output = '';
  const envObj = DEPLOY_ENVS.find(e => e.key === job.env);
  if (!envObj) {
    status = 'failed';
    output = `Invalid environment: ${job.env}`;
    await db.addLog({ jobId: job.id, runAt, status, output });
    await updateJobRun(job.id, runAt, status);
    return;
  }
  try {
    const result = await runRemoteCommand(envObj.command);
    output = result.output;
    status = result.success ? 'success' : 'failed';
  } catch (err) {
    status = 'failed';
    output = err.message || String(err);
  }
  await db.addLog({ jobId: job.id, runAt, status, output });
  await updateJobRun(job.id, runAt, status);
  if (job.email) {
    await sendEmail(job.email, `Job ${job.name} ${status}`, `Job ran at ${runAt}\nStatus: ${status}\nOutput:\n${output}`);
  }
}

async function runRemoteCommand(command) {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: config.remote.ssh.host,
      username: config.remote.ssh.user,
      privateKey: config.remote.ssh.key,
      port: config.remote.ssh.port,
    });
    const result = await ssh.execCommand(command);
    ssh.dispose();
    if (result.code === 0) {
      return { success: true, output: result.stdout + (result.stderr ? ('\n' + result.stderr) : '') };
    } else {
      return { success: false, output: result.stdout + '\n' + result.stderr };
    }
  } catch (err) {
    return { success: false, output: 'SSH error: ' + (err.message || String(err)) };
  }
}

function stopAll() {
  for (const task of scheduledTasks.values()) {
    task.cancel();
  }
  scheduledTasks.clear();
}

async function reload() {
  stopAll();
  const jobs = await db.getJobs();
  for (const job of jobs) {
    if (job.decision === 'approved') {
      await scheduleJob(job);
    } else if (job.decision === 'denied' && job.status === 'scheduled' && new Date(job.runAt) > new Date()) {
      // Mark denied jobs as skipped if not already run
      await updateJobRun(job.id, null, 'skipped');
    }
  }
  console.log(`Scheduler loaded ${jobs.length} jobs.`);
}

async function updateJobRun(id, lastRun, status) {
  return new Promise((resolve, reject) => {
    db.db.run('UPDATE jobs SET lastRun = ?, status = ? WHERE id = ?', [lastRun, status, id], function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function start() {
  reload();
}

module.exports = { start, reload, runAndLogJob }; 