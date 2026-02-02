// Reset admin password to ensure it's correct
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

// Add password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    console.log('🔧 Resetting Admin Password');
    console.log('===========================\n');
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@nexkirana.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('💡 Run create-admin-production.js first');
      return;
    }
    
    console.log('👤 Found admin user:', admin.email);
    console.log('🔑 Current password hash:', admin.password.substring(0, 20) + '...');
    
    // Reset password
    const newPassword = 'Admin123!';
    console.log(`\n🔄 Setting new password: ${newPassword}`);
    
    // Manually hash the password to ensure it's correct
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('🔐 New password hash:', hashedPassword.substring(0, 20) + '...');
    
    // Update the user directly (bypass pre-save middleware)
    await User.updateOne(
      { email: 'admin@nexkirana.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Password updated successfully');
    
    // Verify the password works
    console.log('\n🧪 Testing new password...');
    const updatedAdmin = await User.findOne({ email: 'admin@nexkirana.com' });
    const isMatch = await bcrypt.compare(newPassword, updatedAdmin.password);
    
    console.log(`🔑 Password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (isMatch) {
      console.log('\n🎉 Admin password reset complete!');
      console.log('📧 Email: admin@nexkirana.com');
      console.log('🔑 Password: Admin123!');
      console.log('\n💡 Try logging in now with these credentials');
    } else {
      console.log('\n❌ Password reset failed - something went wrong');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

resetAdminPassword();