// Debug admin user in database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const User = mongoose.model('User', userSchema);

async function debugAdminUser() {
  try {
    console.log('🔍 Debugging Admin User');
    console.log('======================\n');
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all admin users
    console.log('👥 Finding all admin users...');
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`📊 Found ${adminUsers.length} admin user(s)\n`);

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('💡 Run create-admin-production.js to create admin user');
      return;
    }

    // Check each admin user
    for (let i = 0; i < adminUsers.length; i++) {
      const admin = adminUsers[i];
      console.log(`--- Admin User ${i + 1} ---`);
      console.log('📧 Email:', admin.email);
      console.log('👤 Username:', admin.username);
      console.log('🏢 Department:', admin.department);
      console.log('✅ Active:', admin.isActive);
      console.log('🔑 Password Hash:', admin.password.substring(0, 20) + '...');
      console.log('📅 Created:', admin.createdAt);
      console.log('📅 Updated:', admin.updatedAt);
      
      // Test password comparison
      console.log('\n🧪 Testing password combinations:');
      
      const passwords = ['Admin123!', 'admin123', 'Admin123'];
      
      for (const testPassword of passwords) {
        try {
          const isMatch = await admin.comparePassword(testPassword);
          console.log(`   "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        } catch (error) {
          console.log(`   "${testPassword}": ❌ Error - ${error.message}`);
        }
      }
      
      console.log('');
    }

    // Check for duplicate emails
    console.log('🔍 Checking for duplicate emails...');
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateEmails.length > 0) {
      console.log('⚠️  Found duplicate emails:');
      duplicateEmails.forEach(dup => {
        console.log(`   ${dup._id}: ${dup.count} users`);
      });
    } else {
      console.log('✅ No duplicate emails found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

debugAdminUser();