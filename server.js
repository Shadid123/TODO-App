const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { config, sessionOptions } = require('./config');
const { createRateLimiter, requireSameOrigin } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const studentRoutes = require('./routes/student');

const app = express();
const apiRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 300 });
const authRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 20 });

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(sessionOptions));
app.use(apiRateLimiter);
app.use(requireSameOrigin);

app.use('/static', express.static(path.join(__dirname, 'static')));

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/student', studentRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'app.html'));
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
