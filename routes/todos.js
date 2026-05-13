const express = require('express');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleTask
} = require('../models/task');
const { loginRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', loginRequired, async (req, res) => {
  const filters = {};

  if (req.query.category) filters.category = req.query.category;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.sort_by) filters.sort_by = req.query.sort_by;
  if (req.query.completed !== undefined) filters.completed = req.query.completed.toLowerCase() === 'true';

  try {
    const tasks = await getAllTasks(req.session.user_id, filters);
    return res.status(200).json({ todos: tasks });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
});

router.post('/', loginRequired, async (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }

  const title = (data.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (title.length > 200) {
    return res.status(400).json({ error: 'Title must be 200 characters or less' });
  }

  try {
    const taskId = await createTask(req.session.user_id, { ...data, title });
    const task = await getTaskById(taskId, req.session.user_id);
    return res.status(201).json({ message: 'Todo created', todo: task });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create todo', details: error.message });
  }
});

router.put('/:id', loginRequired, async (req, res) => {
  const taskId = Number(req.params.id);
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    const title = (data.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be 200 characters or less' });
    }
    data.title = title;
  }

  try {
    const updated = await updateTask(taskId, req.session.user_id, data);
    if (!updated) {
      return res.status(404).json({ error: 'Todo not found or not authorized' });
    }

    const task = await getTaskById(taskId, req.session.user_id);
    return res.status(200).json({ message: 'Todo updated', todo: task });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update todo', details: error.message });
  }
});

router.delete('/:id', loginRequired, async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    const deleted = await deleteTask(taskId, req.session.user_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found or not authorized' });
    }

    return res.status(200).json({ message: 'Todo deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete todo', details: error.message });
  }
});

router.put('/:id/toggle', loginRequired, async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    const toggled = await toggleTask(taskId, req.session.user_id);
    if (!toggled) {
      return res.status(404).json({ error: 'Todo not found or not authorized' });
    }

    const task = await getTaskById(taskId, req.session.user_id);
    return res.status(200).json({ message: 'Todo toggled', todo: task });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle todo', details: error.message });
  }
});

module.exports = router;
