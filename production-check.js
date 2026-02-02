const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 NexKirana Backend Production Readiness Check');
console.log('===============================================');

// 1. Environment Variables Check
console.log('\n📋 1. Environment Variables Check');
console.log('----------------------------------');

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'NODE_ENV',
  'COMPANY_NAME',
  'SESSION_TIMEOUT'
];

const envIssues = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Not set`);
    envIssues.push(varName);
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});

// 2. Database Connection Check
console.log('\n📋 2. Database Connection Check');
console.log('-------------------------------');

async function checkDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ Cannot test database - MONGODB_URI not set');
      return false;
    }

    console.log('🔄 Testing MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connection successful');
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Test collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📊 Collections: ${collections.length} found`);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// 3. File Structure Check
console.log('\n📋 3. File Structure Check');
console.log('--------------------------');

const requiredFiles = [
  'index.js',
  'package.json',
  'vercel.json',
  '.env',
  'models/User.js',
  'models/Company.js',
  'models/Ledger.js',
  'models/Voucher.js',
  'routes/auth.js',
  'routes/companies.js',
  'routes/ledgers.js',
  'routes/vouchers.js',
  'routes/reports.js',
  'routes/users.js',
  'middleware/auth.js',
  'utils/balanceCalculator.js'
];

const fileIssues = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: Missing`);
    fileIssues.push(file);
  }
});

// 4. Package.json Check
console.log('\n📋 4. Package Dependencies Check');
console.log('--------------------------------');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'express',
    'mongoose',
    'cors',
    'helmet',
    'bcryptjs',
    'jsonwebtoken',
    'dotenv',
    'compression',
    'morgan'
  ];

  const depIssues = [];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: Missing`);
      depIssues.push(dep);
    }
  });

  // Check scripts
  console.log('\n📋 Scripts:');
  if (packageJson.scripts.start) {
    console.log(`✅ start: ${packageJson.scripts.start}`);
  } else {
    console.log('❌ start script missing');
  }

  if (packageJson.engines && packageJson.engines.node) {
    console.log(`✅ Node version: ${packageJson.engines.node}`);
  } else {
    console.log('⚠️  Node version not specified');
  }

} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// 5. Security Check
console.log('\n📋 5. Security Configuration Check');
console.log('----------------------------------');

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
  console.log('✅ JWT_SECRET: Strong (32+ characters)');
} else if (process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET: Weak (less than 32 characters)');
} else {
  console.log('❌ JWT_SECRET: Not set');
}

if (process.env.NODE_ENV === 'production') {
  console.log('✅ NODE_ENV: Set to production');
} else {
  console.log('⚠️  NODE_ENV: Not set to production');
}

// 6. Vercel Configuration Check
console.log('\n📋 6. Vercel Configuration Check');
console.log('---------------------------------');

try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.builds.length > 0) {
    console.log('✅ Vercel builds configuration found');
  } else {
    console.log('❌ Vercel builds configuration missing');
  }

  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log('✅ Vercel routes configuration found');
  } else {
    console.log('❌ Vercel routes configuration missing');
  }

  if (vercelConfig.env) {
    console.log('✅ Vercel environment variables configured');
  } else {
    console.log('⚠️  Vercel environment variables not configured');
  }

} catch (error) {
  console.log('❌ Error reading vercel.json:', error.message);
}

// Main execution
async function runChecks() {
  const dbStatus = await checkDatabase();
  
  console.log('\n🎯 Production Readiness Summary');
  console.log('===============================');
  
  if (envIssues.length === 0) {
    console.log('✅ Environment Variables: All required variables set');
  } else {
    console.log(`❌ Environment Variables: ${envIssues.length} missing - ${envIssues.join(', ')}`);
  }
  
  if (dbStatus) {
    console.log('✅ Database Connection: Working');
  } else {
    console.log('❌ Database Connection: Failed');
  }
  
  if (fileIssues.length === 0) {
    console.log('✅ File Structure: Complete');
  } else {
    console.log(`❌ File Structure: ${fileIssues.length} missing files`);
  }
  
  const totalIssues = envIssues.length + fileIssues.length + (dbStatus ? 0 : 1);
  
  if (totalIssues === 0) {
    console.log('\n🎉 PRODUCTION READY! ✅');
    console.log('Your backend is ready for deployment.');
  } else {
    console.log(`\n⚠️  ${totalIssues} ISSUES FOUND`);
    console.log('Please fix the issues above before deploying to production.');
  }
  
  console.log('\n📞 Next Steps:');
  console.log('1. Fix any issues listed above');
  console.log('2. Set NODE_ENV=production for deployment');
  console.log('3. Configure environment variables in your hosting platform');
  console.log('4. Deploy to Vercel/Render/Railway');
  console.log('5. Run create-admin-production.js to create admin user');
}

runChecks().catch(console.error);