// Debug endpoint to add to server for production debugging
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Debug endpoint to check login process step by step
router.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const debug = {
      step1_request_received: true,
      step2_body_parsed: !!req.body,
      step3_email_received: !!email,
      step4_password_received: !!password,
      step5_user_search: null,
      step6_user_found: false,
      step7_user_active: false,
      step8_password_match: false,
      step9_jwt_secret: !!process.env.JWT_SECRET,
      environment: process.env.NODE_ENV,
      mongodb_connected: require('mongoose').connection.readyState === 1
    };
    
    if (email && password) {
      // Step 5: Search for user
      debug.step5_user_search = 'searching...';
      const user = await User.findOne({ email, isActive: true });
      
      if (user) {
        debug.step6_user_found = true;
        debug.step7_user_active = user.isActive;
        debug.user_info = {
          email: user.email,
          username: user.username,
          role: user.role,
          department: user.department,
          created: user.createdAt
        };
        
        // Step 8: Test password
        const isMatch = await user.comparePassword(password);
        debug.step8_password_match = isMatch;
        
        if (isMatch) {
          debug.login_should_work = true;
        } else {
          debug.login_should_work = false;
          debug.password_issue = 'Password comparison failed';
        }
      } else {
        debug.step5_user_search = 'User not found or inactive';
      }
    }
    
    res.json({
      message: 'Debug information for login process',
      debug: debug,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      message: 'Debug endpoint error',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;