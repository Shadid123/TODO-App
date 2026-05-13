const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const session = require('express-session');

const MySQLStore = require('express-mysql-session')(session);

dotenv.config();

const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  debug: (process.env.DEBUG || 'true').toLowerCase() === 'true',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_app'
  },
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production'
};

if (config.sessionSecret === 'dev-secret-key-change-in-production') {
  console.warn('WARNING: Using default SESSION_SECRET. Set SESSION_SECRET in production.');
}

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const sessionStore = new MySQLStore({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  createDatabaseTable: true
});

const sessionOptions = {
  name: 'session',
  secret: config.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 86400000
  },
  proxy: true
};

module.exports = {
  config,
  pool,
  sessionOptions
};
