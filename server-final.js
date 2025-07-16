// server-final.js - الحل النهائي البسيط
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Prootech Contact Form Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Form submission
app.post('/submit', (req, res) => {
  console.log('📝 Form submission received');
  console.log('📦 Data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { projectType, service, fullName, email, phone, description, budget } = req.body;
    
    // Basic validation
    if (!fullName || !email || !phone || !description) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Log the form data
    console.log('✅ FORM SUBMISSION SUCCESS:');
    console.log('=====================================');
    console.log(`Name: ${fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phone}`);
    console.log(`Project: ${projectType} - ${service}`);
    console.log(`Budget: ${budget}`);
    console.log(`Message: ${description}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('=====================================');
    
    // Always return success
    res.json({
      success: true,
      message: 'Form submitted successfully! We will contact you soon.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log('🚀 Prootech Contact Form Backend');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`🌍 CORS: Enabled`);
  console.log('=====================================');
});

module.exports = app;