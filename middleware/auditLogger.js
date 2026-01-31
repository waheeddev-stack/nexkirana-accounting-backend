const mongoose = require('mongoose');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Audit logging middleware
const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let success = true;
    let errorMessage = null;

    // Override res.send to capture response
    res.send = function(data) {
      responseData = data;
      if (res.statusCode >= 400) {
        success = false;
        try {
          const parsed = JSON.parse(data);
          errorMessage = parsed.message || 'Unknown error';
        } catch (e) {
          errorMessage = data;
        }
      }
      return originalSend.call(this, data);
    };

    // Override res.json to capture response
    res.json = function(data) {
      responseData = data;
      if (res.statusCode >= 400) {
        success = false;
        errorMessage = data.message || 'Unknown error';
      }
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        // Only log if user is authenticated
        if (req.user && req.user._id) {
          const auditEntry = new AuditLog({
            userId: req.user._id,
            username: req.user.username || 'Unknown',
            action,
            resource,
            resourceId: req.params.id || req.body.id || null,
            details: {
              method: req.method,
              url: req.originalUrl,
              body: sanitizeBody(req.body),
              query: req.query,
              statusCode: res.statusCode
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            success,
            errorMessage
          });

          await auditEntry.save();
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
      }
    });
  };
};

// Sanitize sensitive data from request body
const sanitizeBody = (body) => {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Function to get audit logs (admin only)
const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.action) filters.action = new RegExp(req.query.action, 'i');
    if (req.query.resource) filters.resource = new RegExp(req.query.resource, 'i');
    if (req.query.success !== undefined) filters.success = req.query.success === 'true';

    const logs = await AuditLog.find(filters)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filters);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  auditLogger,
  getAuditLogs,
  AuditLog
};