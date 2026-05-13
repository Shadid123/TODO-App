const express = require('express');
const router = express.Router();
const { createUser, getUserByUsername, getUserByEmail, getUserById, verifyPassword } = require('../models/user');
const { loginRequired } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

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
    if (atIdx <= 0 || atIdx === email.length - 1 || !email.substring(atIdx).includes('.') || email.endsWith('.')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = await createUser(username, email, password);
    req.session.user_id = userId;
    req.session.username = username;

    res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, username, email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValidPassword = await verifyPassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.user_id = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', loginRequired, async (req, res) => {
  try {
    const user = await getUserById(req.session.user_id);
    if (!user) {
      req.session.destroy();
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info', details: error.message });
  }
});

module.exports = router;
