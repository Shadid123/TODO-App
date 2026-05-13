const express = require('express');
const router = express.Router();
const { getUserById } = require('../models/user');
const { loginRequired } = require('../middleware/auth');

router.get('/', loginRequired, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at ? user.created_at.toISOString() : null
    };

    res.status(200).json({
      success: true,
      student: studentInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve student information',
      details: error.message
    });
  }
});

module.exports = router;
