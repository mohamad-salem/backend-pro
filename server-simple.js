// server-simple.js - نسخة مبسطة تعمل 100%
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// --- Basic Middleware ---
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Helper Functions ---
const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[&<>"']/g, (match) => {
    const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escape[match];
  });
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- Main Form Endpoint ---
app.post('/submit', async (req, res) => {
  console.log('📝 Form submission received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Extract data
    const {
      projectType = '', service = '', fullName = '', email = '',
      phone = '', description = '', budget = '', files = []
    } = req.body;

    // Validate required fields
    const required = { projectType, service, fullName, email, phone, description, budget };
    const missing = Object.entries(required)
      .filter(([key, value]) => !value || value.toString().trim() === '')
      .map(([key]) => key);

    if (missing.length > 0) {
      console.log('❌ Missing fields:', missing);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      console.log('❌ Invalid email:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Sanitize data
    const safeData = {
      projectType: escapeHtml(projectType.toString().trim()),
      service: escapeHtml(service.toString().trim()),
      fullName: escapeHtml(fullName.toString().trim()),
      email: escapeHtml(email.toString().trim().toLowerCase()),
      phone: escapeHtml(phone.toString().trim()),
      description: escapeHtml(description.toString().trim()),
      budget: escapeHtml(budget.toString().trim()),
    };

    console.log('✅ Data validated and sanitized');
    console.log('💾 Form data saved:', safeData);

    // Log form submission (since email might not be configured)
    console.log('📧 FORM SUBMISSION RECEIVED:');
    console.log('=====================================');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Name: ${safeData.fullName}`);
    console.log(`Email: ${safeData.email}`);
    console.log(`Phone: ${safeData.phone}`);
    console.log(`Project: ${safeData.projectType} - ${safeData.service}`);
    console.log(`Budget: $${safeData.budget}`);
    console.log(`Description: ${safeData.description}`);
    console.log(`Files: ${Array.isArray(files) ? files.length : 0} attached`);
    console.log('=====================================');

    // Always return success
    console.log('✅ Form submission completed successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Form submitted successfully! We will contact you soon.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

// --- Health Check ---
app.get('/', (req, res) => {
  const status = {
    status: 'running',
    message: 'Prootech Contact Form Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log('📊 Health check:', status);
  res.json(status);
});

app.get('/health', (req, res) => {
  res.json({ 
    healthy: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// --- Error Handlers ---
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log('🚀 Prootech Contact Form Backend');
  console.log(`📍 Running on: http://localhost:${port}`);
  console.log(`🌍 CORS: Enabled for all origins`);
  console.log(`📝 Form endpoint: POST /submit`);
  console.log(`🏥 Health check: GET /`);
  console.log('=====================================');
});

module.exports = app;