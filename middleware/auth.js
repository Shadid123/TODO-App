function loginRequired(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

module.exports = {
  loginRequired
};
