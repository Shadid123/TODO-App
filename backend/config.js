require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  session: {
    secret: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
  },
  port: process.env.PORT || 5000,
  debug: process.env.DEBUG === 'true'
};

if (config.session.secret === 'dev-secret-key-change-in-production') {
  console.warn('WARNING: Using default SECRET_KEY. Set a strong SECRET_KEY in production!');
}

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(config.database);
  }
  return pool;
};

const getConnection = async () => {
  const pool = getPool();
  return await pool.getConnection();
};

module.exports = {
  config,
  getPool,
  getConnection
};