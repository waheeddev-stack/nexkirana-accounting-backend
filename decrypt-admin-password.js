// Decrypt/verify admin password in production database
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

async function decryptAdminPassword() {
  try {
    console.log('🔍 Production Password Analysis');
    console.log('==============================\n');
    
    console.log('🔗 Connecting to production MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to production database\n');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@nexkirana.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found in production database!');
      return;
    }
    
    console.log('👤 Admin User Found:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🏢 Role:', admin.role);
    console.log('🏢 Department:', admin.department);
    console.log('✅ Active:', admin.isActive);
    console.log('📅 Created:', admin.createdAt);
    console.log('📅 Updated:', admin.updatedAt);
    console.log('🔐 Password Hash:', admin.password);
    console.log('🔐 Hash Length:', admin.password.length);
    console.log('🔐 Hash Type:', admin.password.startsWith('$2a$') ? 'bcrypt' : 'unknown');
    
    console.log('\n🧪 Testing Common Passwords:');
    
    const commonPasswords = [
      'Admin123!',
      'admin123',
      'Admin123',
      'admin',
      'password',
      'Admin@123',
      'nexkirana123',
      'tallyprime123'
    ];
    
    let correctPassword = null;
    
    for (const testPassword of commonPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        console.log(`   "${testPassword}": ${isMatch ? '✅ CORRECT PASSWORD!' : '❌ Wrong'}`);
        
        if (isMatch) {
          correctPassword = testPassword;
          break;
        }
      } catch (error) {
        console.log(`   "${testPassword}": ❌ Error - ${error.message}`);
      }
    }
    
    if (correctPassword) {
      console.log('\n🎉 CORRECT PASSWORD FOUND!');
      console.log('==========================================');
      console.log('📧 Email: admin@nexkirana.com');
      console.log('🔑 Password:', correctPassword);
      console.log('==========================================');
      console.log('\n💡 Use these credentials to login to your application');
    } else {
      console.log('\n❌ None of the common passwords match');
      console.log('💡 The password might be different than expected');
      
      // Let's create a new password and update it
      console.log('\n🔧 Creating new password: "Admin123!"');
      const newHashedPassword = await bcrypt.hash('Admin123!', 12);
      
      await User.updateOne(
        { email: 'admin@nexkirana.com' },
        { 
          $set: { 
            password: newHashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Password updated to: Admin123!');
      console.log('🎯 Try logging in with: admin@nexkirana.com / Admin123!');
    }
    
    // Additional debugging info
    console.log('\n🔍 Additional Debug Info:');
    console.log('- Hash starts with:', admin.password.substring(0, 10));
    console.log('- Hash algorithm:', admin.password.split('$')[1] || 'unknown');
    console.log('- Hash rounds:', admin.password.split('$')[2] || 'unknown');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

decryptAdminPassword();