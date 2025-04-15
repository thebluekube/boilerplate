require('dotenv').config();
const express = require('express');
const cors = require('cors');
const basicAuth = require('basic-auth');

const jobsRouter = require('./api/jobs');
const deployRouter = require('./api/deploy');
const scheduler = require('./scheduler');
const db = require('./db');
const { DEPLOY_ENVS } = require('./envs');

const app = express();

app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  if (req.path === '/') return next();
  const user = basicAuth(req);
  const validUser = process.env.BASIC_AUTH_USER;
  const validPass = process.env.BASIC_AUTH_PASS;
  if (!user || user.name !== validUser || user.pass !== validPass) {
    res.set('WWW-Authenticate', 'Basic realm="Dashboard"');
    return res.status(401).send('Authentication required.');
  }
  next();
}

app.use(authMiddleware);

app.get('/', (req, res) => {
  res.send('Job Scheduler Backend is running.');
});

app.get('/api/envs', (req, res) => {
  res.json(DEPLOY_ENVS.map(({ key, name }) => ({ key, name })));
});

app.use('/api/jobs', jobsRouter);
app.use('/api/deploy', deployRouter);

// Start scheduler
scheduler.start();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

module.exports = { DEPLOY_ENVS }; 