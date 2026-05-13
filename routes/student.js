const express = require('express');
const { loginRequired } = require('../middleware/auth');
const { getUserById } = require('../models/user');

const router = express.Router();

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }

  const asString = String(value);
  return asString.includes(' ') ? asString.replace(/\s/g, 'T') : asString;
}

router.get('/', loginRequired, async (req, res) => {
  try {
    const user = await getUserById(req.session.user_id);

    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.status(200).json({
      success: true,
      student: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: normalizeDate(user.created_at)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve student information',
      details: error.message
    });
  }
});

module.exports = router;
