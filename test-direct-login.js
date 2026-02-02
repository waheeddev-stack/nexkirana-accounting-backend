// Test login logic directly (bypass API)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// User schema (same as in models/User.js)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'accountant', 'user'], default: 'user' },
  department: { type: String, enum: ['accounts', 'sales', 'purchase', 'inventory', 'admin'], default: 'accounts' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  permissions: {
    canCreateCompany: { type: Boolean, default: false },
    canDeleteVouchers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function() {
  return this.updateOne({
    $set: { lastLogin: new Date() }
  });
};

const User = mongoose.model('User', userSchema);

async function testDirectLogin() {
  try {
    console.log('🧪 Testing Direct Login Logic');
    console.log('=============================\n');
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'admin@nexkirana.com';
    const password = 'Admin123!';
    
    console.log(`🔍 Testing login for: ${email}`);
    console.log(`🔑 Password: ${password}\n`);

    // Step 1: Find user
    console.log('Step 1: Finding user...');
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      console.log('❌ User not found or inactive');
      return;
    }
    
    console.log('✅ User found');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🏢 Role:', user.role);
    console.log('✅ Active:', user.isActive);
    
    // Step 2: Compare password
    console.log('\nStep 2: Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log(`🔑 Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    
    if (!isMatch) {
      console.log('❌ Password comparison failed');
      return;
    }
    
    // Step 3: Generate JWT token
    console.log('\nStep 3: Generating JWT token...');
    
    const jwtSecret = process.env.JWT_SECRET;
    console.log('🔐 JWT Secret:', jwtSecret ? 'Set' : 'Not set');
    
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET not found in environment variables');
      return;
    }
    
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        department: user.department
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log('🎫 Token preview:', token.substring(0, 50) + '...');
    
    // Step 4: Update last login
    console.log('\nStep 4: Updating last login...');
    await user.updateLastLogin();
    console.log('✅ Last login updated');
    
    console.log('\n🎉 Direct login test SUCCESSFUL!');
    console.log('📋 Response would be:');
    console.log({
      token: token.substring(0, 50) + '...',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department
      },
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
    
    console.log('\n💡 If API login fails but this works, check:');
    console.log('1. API route validation');
    console.log('2. Request body parsing');
    console.log('3. Middleware interference');
    console.log('4. Environment variables in production');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testDirectLogin();