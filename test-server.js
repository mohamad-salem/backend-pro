// test-server.js - اختبار الباك إند محلياً
const http = require('http');

const SERVER_URL = 'https://backend-prootech1.vercel.app';

// Test data
const testData = {
  projectType: 'design',
  service: 'Logo Design',
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  description: 'This is a test submission to verify the backend is working correctly.',
  budget: '300-500',
  files: []
};

async function testServer() {
  console.log('🧪 Testing Prootech Backend Server');
  console.log('=====================================');
  
  // Test 1: Health Check
  console.log('\n1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${SERVER_URL}/`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
      console.log('📊 Server status:', healthData);
    } else {
      console.log('❌ Health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('💡 Make sure the server is running with: npm start');
    return;
  }
  
  // Test 2: Form Submission
  console.log('\n2. Testing form submission...');
  try {
    const response = await fetch(`${SERVER_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Form submission test passed');
      console.log('📧 Response:', result.message);
    } else {
      console.log('❌ Form submission test failed');
      console.log('📄 Response:', result);
    }
  } catch (error) {
    console.log('❌ Form submission error:', error.message);
  }
  
  // Test 3: Validation Test
  console.log('\n3. Testing validation...');
  try {
    const invalidData = { email: 'invalid-email' };
    const response = await fetch(`${SERVER_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });
    
    const result = await response.json();
    
    if (response.status === 400 && !result.success) {
      console.log('✅ Validation test passed');
      console.log('📝 Validation message:', result.message);
    } else {
      console.log('❌ Validation test failed - should reject invalid data');
    }
  } catch (error) {
    console.log('❌ Validation test error:', error.message);
  }
  
  console.log('\n=====================================');
  console.log('🏁 Testing completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Check if fetch is available (Node.js 18+)
  if (typeof fetch === 'undefined') {
    console.log('❌ This test requires Node.js 18+ or you need to install node-fetch');
    console.log('💡 Alternative: Test manually using the browser or Postman');
    process.exit(1);
  }
  
  testServer().catch(console.error);
}

module.exports = { testServer };