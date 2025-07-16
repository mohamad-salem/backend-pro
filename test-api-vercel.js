// test-api-vercel.js - اختبار API على Vercel
const https = require('https');

const testData = {
  projectType: "Website Development",
  service: "Full Stack Development", 
  fullName: "Test User",
  email: "test@example.com",
  phone: "+1234567890",
  description: "Test description for API verification",
  budget: "$5000-$10000"
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'backend-prootech1.vercel.app',
  port: 443,
  path: '/submit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing Vercel API...');
console.log('URL: https://backend-prootech1.vercel.app/submit');
console.log('Data:', testData);
console.log('---');

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ API Test PASSED - Email functionality working!');
    } else if (res.statusCode === 500) {
      console.log('⚠️  API Test PARTIAL - Server running but email config needed');
    } else {
      console.log('❌ API Test FAILED');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.write(postData);
req.end();