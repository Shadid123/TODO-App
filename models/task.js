const { pool } = require('../config');

const SORT_CLAUSES = {
  due_date: ' ORDER BY due_date IS NULL, due_date ASC',
  priority: " ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')",
  created_at: ' ORDER BY created_at DESC',
  updated_at: ' ORDER BY updated_at DESC'
};

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }

  const asString = String(value);
  return asString.includes(' ') ? asString.replace(/\s/g, 'T') : asString;
}

function normalizeTask(task) {
  return {
    ...task,
    due_date: normalizeDate(task.due_date),
    created_at: normalizeDate(task.created_at),
    updated_at: normalizeDate(task.updated_at),
    completed: Boolean(task.completed)
  };
}

async function getAllTasks(userId, filters = {}) {
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (typeof filters.completed === 'boolean') {
    query += ' AND completed = ?';
    params.push(filters.completed);
  }

  query += SORT_CLAUSES[filters.sort_by] || SORT_CLAUSES.created_at;

  const [rows] = await pool.execute(query, params);
  return rows.map(normalizeTask);
}

async function getTaskById(taskId, userId) {
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  return rows[0] ? normalizeTask(rows[0]) : null;
}

async function createTask(userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO tasks (user_id, title, description, category, priority, due_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
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
}

async function updateTask(taskId, userId, data) {
  const fields = [];
  const params = [];
  const allowedFields = ['title', 'description', 'category', 'priority', 'due_date', 'completed'];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      fields.push(`${field} = ?`);
      if (field === 'due_date' && data[field] === '') {
        params.push(null);
      } else {
        params.push(data[field]);
      }
    }
  }

  if (!fields.length) {
    return false;
  }

  params.push(taskId, userId);

  const [result] = await pool.execute(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    params
  );

  return result.affectedRows > 0;
}

async function deleteTask(taskId, userId) {
  const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  return result.affectedRows > 0;
}

async function toggleTask(taskId, userId) {
  const [result] = await pool.execute(
    'UPDATE tasks SET completed = NOT completed WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTask
};
