const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const securityMiddleware = require('./middleware/security');

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Security middleware
securityMiddleware(app);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/ledgers', require('./routes/ledgers'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NexKirana Accounting System',
    version: '1.0.0'
  });
});

// Database connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ 
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 NexKirana Accounting System running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 Security: Enhanced for internal use`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = app;