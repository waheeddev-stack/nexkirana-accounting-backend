// Test API validation logic
const { body, validationResult } = require('express-validator');

// Simulate the validation that happens in the login route
function testValidation() {
  console.log('🧪 Testing API Validation Logic');
  console.log('===============================\n');
  
  // Test data that would come from the request
  const testRequests = [
    {
      name: 'Valid Request',
      body: { email: 'admin@nexkirana.com', password: 'Admin123!' }
    },
    {
      name: 'Invalid Email',
      body: { email: 'invalid-email', password: 'Admin123!' }
    },
    {
      name: 'Missing Password',
      body: { email: 'admin@nexkirana.com' }
    },
    {
      name: 'Empty Password',
      body: { email: 'admin@nexkirana.com', password: '' }
    }
  ];
  
  testRequests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}:`);
    console.log('   Body:', JSON.stringify(test.body));
    
    // Simulate email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const isValidEmail = emailRegex.test(test.body.email || '');
    console.log(`   Email valid: ${isValidEmail ? '✅' : '❌'}`);
    
    // Simulate password validation
    const hasPassword = test.body.password && test.body.password.length > 0;
    console.log(`   Password exists: ${hasPassword ? '✅' : '❌'}`);
    
    const wouldPass = isValidEmail && hasPassword;
    console.log(`   Would pass validation: ${wouldPass ? '✅' : '❌'}`);
    console.log('');
  });
  
  console.log('💡 If validation passes but login still fails, check:');
  console.log('1. Request body parsing middleware');
  console.log('2. Content-Type headers');
  console.log('3. Express.json() middleware');
  console.log('4. CORS preflight requests');
}

testValidation();