const bcrypt = require('bcryptjs');
const { getConnection } = require('../config');

const createUser = async (username, email, password) => {
  let conn;
  try {
    conn = await getConnection();
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await conn.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    return result.insertId;
  } finally {
    if (conn) conn.release();
  }
};

const getUserByUsername = async (username) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? rows[0] : null;
  } finally {
    if (conn) conn.release();
  }
};

const getUserByEmail = async (email) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  } finally {
    if (conn) conn.release();
  }
};

const getUserById = async (userId) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } finally {
    if (conn) conn.release();
  }
};

const verifyPassword = async (user, password) => {
  return await bcrypt.compare(password, user.password_hash);
};

module.exports = {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  verifyPassword
};
