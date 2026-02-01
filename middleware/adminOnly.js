const adminOnly = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Administrator privileges required.',
        code: 'ADMIN_REQUIRED',
        userRole: req.user.role
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Authorization check failed',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = adminOnly;