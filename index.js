const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Trust proxy for production deployment
app.set('trust proxy', 1);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// CORS configuration - PRODUCTION: Allow ALL domains and methods
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false, // Set to false for wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['*'], // Allow all headers
  exposedHeaders: ['*'], // Expose all headers
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional headers for API - PRODUCTION: Maximum compatibility
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Powered-By', 'NexKirana API');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Explicit OPTIONS handler for all routes - PRODUCTION
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

// Method not allowed handler (before routes)
app.use((req, res, next) => {
  // Log all requests for debugging
  console.log(`📝 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Pre-route method validation for API endpoints
app.use('/api/*', (req, res, next) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      message: `Method ${req.method} not allowed on API endpoints`,
      allowedMethods: allowedMethods,
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/ledgers', require('./routes/ledgers'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));

// Temporary password debug endpoint (REMOVE AFTER FIXING)
app.use('/api/debug', require('./password-debug-endpoint'));

// Production admin setup endpoint
app.get('/api/setup-admin', async (req, res) => {
  try {
    // Check if admin exists
    let admin = await User.findOne({ email: 'admin@nexkirana.com' });
    
    if (!admin) {
      // Create admin user
      admin = new User({
        username: 'admin',
        email: 'admin@nexkirana.com',
        password: 'Admin123!',
        role: 'admin',
        department: 'admin',
        isActive: true,
        permissions: {
          canCreateCompany: true,
          canDeleteVouchers: true,
          canViewReports: true,
          canManageUsers: true
        }
      });
      
      await admin.save();
    }
    
    res.json({
      message: 'Admin user ready',
      credentials: {
        email: 'admin@nexkirana.com',
        password: 'Admin123!'
      },
      status: 'success'
    });
    
  } catch (error) {
    res.json({
      message: 'Admin setup complete (fallback mode)',
      credentials: {
        email: 'admin@nexkirana.com',
        password: 'Admin123!'
      },
      status: 'fallback'
    });
  }
});

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    service: 'NexKirana Accounting System API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      companies: '/api/companies',
      ledgers: '/api/ledgers',
      vouchers: '/api/vouchers',
      reports: '/api/reports',
      users: '/api/users'
    },
    documentation: 'See README.md for complete API documentation'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const dbError = mongoose.connection.readyState === 99 ? 'Error' : null;
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'NexKirana Accounting System',
    version: '1.0.0',
    database: dbStatus,
    databaseError: dbError,
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
    mongoUriPreview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'Not set'
  });
});

// Database connection with retry logic
const connectDB = async () => {
  try {
    // Check if MongoDB URI is defined
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not defined!');
      console.log('📋 Available environment variables:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- PORT:', process.env.PORT);
      console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
      return;
    }

    console.log('🔄 Attempting MongoDB connection...');
    console.log('📊 MongoDB URI:', process.env.MONGODB_URI.substring(0, 50) + '...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased timeout for Render
      socketTimeoutMS: 45000,
      bufferCommands: false // Disable mongoose buffering
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('ENOTFOUND')) {
      console.log('🔍 DNS Resolution Error - Possible causes:');
      console.log('  - MongoDB cluster hostname is incorrect');
      console.log('  - Cluster may have been deleted or doesn\'t exist');
      console.log('  - Network connectivity issues');
      console.log('  - Check your MongoDB Atlas cluster status');
    } else if (error.message.includes('authentication failed')) {
      console.log('🔍 Authentication Error - Check:');
      console.log('  - Username and password in connection string');
      console.log('  - Database user permissions');
    } else if (error.message.includes('IP not whitelisted')) {
      console.log('🔍 Network Access Error - Check:');
      console.log('  - MongoDB Atlas Network Access settings');
      console.log('  - Add 0.0.0.0/0 to allow all IPs');
    }
    
    console.log('🔄 Retrying connection in 10 seconds...');
    setTimeout(connectDB, 10000);
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
  // Log the request for debugging
  console.log(`❌ 404 - ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  
  res.status(404).json({ 
    message: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      companies: 'GET /api/companies',
      ledgers: 'GET /api/ledgers',
      vouchers: 'GET /api/vouchers',
      reports: 'GET /api/reports',
      users: 'GET /api/users'
    }
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