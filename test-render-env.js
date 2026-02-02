// Test Render environment variables
require('dotenv').config();

console.log('🔍 Render Environment Variables Check');
console.log('====================================\n');

console.log('📋 Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('- PORT:', process.env.PORT || 'Not set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set (' + process.env.MONGODB_URI.substring(0, 50) + '...)' : 'Not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set (' + process.env.JWT_SECRET.length + ' chars)' : 'Not set');
console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'Not set (defaults to 8h)');

console.log('\n🔍 Potential Issues:');

if (!process.env.JWT_SECRET) {
  console.log('❌ JWT_SECRET is missing - this would cause login failures');
} else {
  console.log('✅ JWT_SECRET is set');
}

if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI is missing - database connection would fail');
} else {
  console.log('✅ MONGODB_URI is set');
}

console.log('\n💡 If environment variables are different on Render:');
console.log('1. Check Render dashboard environment variables');
console.log('2. Ensure JWT_SECRET is set on Render');
console.log('3. Verify MONGODB_URI is correct on Render');
console.log('4. Restart Render service after changes');

console.log('\n🧪 Test JWT Token Generation:');
try {
  const jwt = require('jsonwebtoken');
  const testToken = jwt.sign(
    { userId: 'test', role: 'admin' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );
  console.log('✅ JWT generation works');
  console.log('🎫 Test token:', testToken.substring(0, 50) + '...');
} catch (error) {
  console.log('❌ JWT generation failed:', error.message);
}