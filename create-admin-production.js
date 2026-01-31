const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection URI - update this with your production database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tallyprime:tallyprime123@cluster1.fst5z2o.mongodb.net/nexkirana-accounting?retryWrites=true&w=majority&appName=Cluster1';

// User schema (simplified for this script)
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@nexkirana.com' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('📧 Email: admin@nexkirana.com');
      console.log('🔑 Use existing password or reset if needed');
      process.exit(0);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@nexkirana.com',
      password: 'Admin123!', // This will be hashed by the pre-save middleware
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

    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@nexkirana.com');
    console.log('🔑 Password: Admin123!');
    console.log('👑 Role: Administrator');
    console.log('🏢 Department: Administration');
    console.log('');
    console.log('🚀 You can now login to your NexKirana Accounting System!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('ℹ️  Admin user might already exist with this email or username');
    }
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
console.log('🚀 NexKirana Admin User Creation Script');
console.log('=====================================');
createAdminUser();