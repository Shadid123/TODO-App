const express = require('express');
const {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  verifyPassword
} = require('../models/user');
const { sessionOptions } = require('../config');
const { loginRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }

  const username = (data.username || '').trim();
  const email = (data.email || '').trim();
  const password = data.password || '';

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const atIdx = email.indexOf('@');
  if (atIdx <= 0 || atIdx === email.length - 1 || !email.slice(atIdx).includes('.') || email.endsWith('.')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    if (await getUserByUsername(username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = await createUser(username, email, password);
    req.session.user_id = userId;
    req.session.username = username;

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, username, email }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }

  const username = (data.username || '').trim();
  const password = data.password || '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await getUserByUsername(username);

    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.user_id = user.id;
    req.session.username = user.username;

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(sessionOptions.name || 'session');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.get('/me', loginRequired, async (req, res) => {
  try {
    const user = await getUserById(req.session.user_id);

    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get user info', details: error.message });
  }
});

module.exports = router;
