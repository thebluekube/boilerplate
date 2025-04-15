const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'scheduler.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    runAt TEXT NOT NULL,
    env TEXT NOT NULL,
    params TEXT,
    email TEXT,
    lastRun TEXT,
    status TEXT,
    decision TEXT DEFAULT 'pending'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId INTEGER,
    runAt TEXT,
    status TEXT,
    output TEXT,
    FOREIGN KEY(jobId) REFERENCES jobs(id)
  )`);
});

function getJobs() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM jobs', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getJob(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function addJob(job) {
  return new Promise((resolve, reject) => {
    const { name, runAt, env, params, email, status } = job;
    db.run(
      'INSERT INTO jobs (name, runAt, env, params, email, status, decision) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, runAt, env, JSON.stringify(params || {}), email, status || 'scheduled', 'pending'],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function setJobDecision(id, decision) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE jobs SET decision = ? WHERE id = ?', [decision, id], function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function deleteJob(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM jobs WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function addLog(log) {
  return new Promise((resolve, reject) => {
    const { jobId, runAt, status, output } = log;
    db.run(
      'INSERT INTO logs (jobId, runAt, status, output) VALUES (?, ?, ?, ?)',
      [jobId, runAt, status, output],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function getLogs(jobId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM logs WHERE jobId = ? ORDER BY runAt DESC', [jobId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  getJobs,
  getJob,
  addJob,
  setJobDecision,
  deleteJob,
  addLog,
  getLogs,
  db // export for direct access if needed
}; 