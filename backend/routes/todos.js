const express = require('express');
const router = express.Router();
const { getAllTasks, getTaskById, createTask, updateTask, deleteTask, toggleTask } = require('../models/task');
const { loginRequired } = require('../middleware/auth');

// Get all todos
router.get('/', loginRequired, async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.completed !== undefined) filters.completed = req.query.completed === 'true';
    if (req.query.sort_by) filters.sort_by = req.query.sort_by;
    if (req.query.order) filters.order = req.query.order.toUpperCase();

    const tasks = await getAllTasks(req.session.user_id, filters);
    res.json({ success: true, todos: tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
});

// Get single todo by ID
router.get('/:id', loginRequired, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id, req.session.user_id);
    if (!task) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ success: true, todo: task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todo', details: error.message });
  }
});

// Create todo
router.post('/', loginRequired, async (req, res) => {
  try {
    const { title, description, category, priority, due_date } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const taskId = await createTask(req.session.user_id, {
      title,
      description: description || '',
      category: category || 'Other',
      priority: priority || 'Medium',
      due_date: due_date || null
    });

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      todo_id: taskId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo', details: error.message });
  }
});

// Update todo
router.put('/:id', loginRequired, async (req, res) => {
  try {
    const updated = await updateTask(req.params.id, req.session.user_id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Todo not found or no changes' });
    }
    res.json({ success: true, message: 'Todo updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo', details: error.message });
  }
});

// Delete todo
router.delete('/:id', loginRequired, async (req, res) => {
  try {
    const deleted = await deleteTask(req.params.id, req.session.user_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo', details: error.message });
  }
});

// Toggle todo completion
router.put('/:id/toggle', loginRequired, async (req, res) => {
  try {
    const toggled = await toggleTask(req.params.id, req.session.user_id);
    if (!toggled) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ success: true, message: 'Todo toggled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle todo', details: error.message });
  }
});

module.exports = router;
