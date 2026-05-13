const bcrypt = require('bcryptjs');
const { pool } = require('../config');

async function createUser(username, email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );

  return result.insertId;
}

async function getUserByUsername(username) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function getUserById(userId) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return rows[0] || null;
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

module.exports = {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  verifyPassword
};
