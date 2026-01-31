const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAuditLogs } = require('../middleware/auditLogger');

// Get audit logs (admin only)
router.get('/', auth, getAuditLogs);

module.exports = router;