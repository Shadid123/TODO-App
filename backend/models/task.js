const { getConnection } = require('../config');

const getAllTasks = async (userId, filters = {}) => {
  let conn;
  try {
    conn = await getConnection();
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    let params = [userId];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters.completed !== undefined) {
      query += ' AND completed = ?';
      params.push(filters.completed ? 1 : 0);
    }

    const sortBy = filters.sort_by || 'created_at';
    const order = filters.order || 'DESC';
    query += ` ORDER BY ${sortBy} ${order}`;

    const [rows] = await conn.execute(query, params);
    return rows.map(task => ({
      ...task,
      due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null,
      completed: Boolean(task.completed)
    }));
  } finally {
    if (conn) conn.release();
  }
};

const getTaskById = async (taskId, userId) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    if (rows.length === 0) return null;
    const task = rows[0];
    return {
      ...task,
      due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null,
      completed: Boolean(task.completed)
    };
  } finally {
    if (conn) conn.release();
  }
};

const createTask = async (userId, data) => {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO tasks (user_id, title, description, category, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [
        userId,
        data.title,
        data.description || '',
        data.category || 'Other',
        data.priority || 'Medium',
        data.due_date || null
      ]
    );
    return result.insertId;
  } finally {
    if (conn) conn.release();
  }
};

const updateTask = async (taskId, userId, data) => {
  let conn;
  try {
    conn = await getConnection();
    const fields = [];
    const params = [];
    const allowedFields = ['title', 'description', 'category', 'priority', 'due_date', 'completed'];

    for (const field of allowedFields) {
      if (field in data) {
        fields.push(`${field} = ?`);
        if (field === 'due_date' && data[field] === '') {
          params.push(null);
        } else {
          params.push(data[field]);
        }
      }
    }

    if (fields.length === 0) return false;
    params.push(taskId, userId);
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    const [result] = await conn.execute(query, params);
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
};

const deleteTask = async (taskId, userId) => {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
};

const toggleTask = async (taskId, userId) => {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.execute(
      'UPDATE tasks SET completed = NOT completed WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTask
};
