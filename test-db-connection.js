const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...');
console.log('================================');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`);

const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connection Successful!');
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📊 Port: ${conn.connection.port}`);
    console.log(`📊 Ready State: ${conn.connection.readyState}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📊 Collections: ${collections.length} found`);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error Details:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🔍 DNS Resolution Issue - Possible causes:');
      console.log('   - Internet connection problems');
      console.log('   - MongoDB cluster is down');
      console.log('   - Incorrect cluster URL');
      console.log('   - Firewall blocking connection');
    }
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('🔍 Server Selection Issue - Possible causes:');
      console.log('   - IP address not whitelisted in MongoDB Atlas');
      console.log('   - Incorrect credentials');
      console.log('   - Network connectivity issues');
    }
    
    process.exit(1);
  }
};

testConnection();