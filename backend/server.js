require('dotenv').config();
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { config } = require('./config');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const studentRoutes = require('./routes/student');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session Configuration
app.use(session(config.session));

const pageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

// Static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// View engine
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '../frontend'));
app.engine('html', require('ejs').renderFile);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/student', studentRoutes);

// Root routes
app.get('/', pageRateLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/app', pageRateLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.DEBUG ? 'development' : 'production'}`);
});

module.exports = app;
