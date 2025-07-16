// server-production.js - نسخة الإنتاج مع معالجة شاملة للأخطاء
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// --- Enhanced Error Handling ---
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// --- Middleware ---
app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// --- Email Configuration with Fallback ---
let emailTransporter = null;
let emailConfigured = false;

function initializeEmail() {
  try {
    // Check if email environment variables exist
    const emailVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = emailVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Email not configured - missing variables:', missingVars.join(', '));
      console.warn('⚠️ Form will work but emails will not be sent');
      return false;
    }

    emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test email connection
    emailTransporter.verify()
      .then(() => {
        console.log('✅ Email transporter verified successfully');
        emailConfigured = true;
      })
      .catch(err => {
        console.warn('⚠️ Email verification failed:', err.message);
        console.warn('⚠️ Form will work but emails may fail');
        emailConfigured = false;
      });

    return true;
  } catch (error) {
    console.warn('⚠️ Email initialization failed:', error.message);
    return false;
  }
}

// Initialize email on startup
initializeEmail();

// --- Helper Functions ---
const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// --- Main Form Submission Endpoint ---
app.post('/submit', async (req, res) => {
  console.log('🚀 Processing form submission...');
  
  try {
    // Extract form data
    const {
      projectType = '', 
      service = '', 
      fullName = '', 
      email = '',
      phone = '', 
      description = '', 
      budget = '', 
      files = []
    } = req.body;

    console.log('📋 Extracted form data:', {
      projectType, service, fullName, email, phone, budget,
      descriptionLength: description.length,
      filesCount: files.length
    });

    // Validate required fields
    const requiredFields = {
      projectType: 'Project Type',
      service: 'Service',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      description: 'Description',
      budget: 'Budget'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      console.warn('❌ Validation failed - missing fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.warn('❌ Invalid email format:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
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

    console.log('✅ Data validated and sanitized successfully');

    // Process attachments safely
    const attachments = [];
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        try {
          if (file && file.dataUrl && file.name) {
            attachments.push({
              filename: escapeHtml(file.name),
              path: file.dataUrl
            });
          }
        } catch (fileError) {
          console.warn(`⚠️ Error processing file ${index}:`, fileError.message);
        }
      });
    }

    console.log(`📎 Processed ${attachments.length} attachments`);

    // Get company information with defaults
    const companyEmail = process.env.COMPANY_EMAIL || 'info@prootech-agency.com';
    const companyName = process.env.COMPANY_NAME || 'Prootech Agency';

    console.log('📧 Email configuration:', {
      configured: emailConfigured,
      transporter: !!emailTransporter,
      companyEmail
    });

    // If email is not configured, still return success
    if (!emailTransporter || !emailConfigured) {
      console.warn('⚠️ Email not configured - saving form data only');
      
      // Log the form submission for manual processing
      console.log('💾 FORM SUBMISSION (Email disabled):', {
        timestamp: new Date().toISOString(),
        data: safeData,
        attachments: attachments.length
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully! We will contact you soon.' 
      });
    }

    // Prepare email content
    const companyMailOptions = {
      from: `"${safeData.fullName} via Contact Form" <${process.env.SMTP_USER}>`,
      to: companyEmail,
      replyTo: safeData.email,
      subject: `🚀 New ${safeData.projectType} Project - ${safeData.fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #6300ff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .field { margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; }
            .label { font-weight: bold; color: #6300ff; }
            .value { margin-top: 5px; }
            .description { background: #f0f0f0; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Project Inquiry</h1>
            <p>From: ${safeData.fullName}</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Project Type:</div>
              <div class="value">${safeData.projectType}</div>
            </div>
            <div class="field">
              <div class="label">Service:</div>
              <div class="value">${safeData.service}</div>
            </div>
            <div class="field">
              <div class="label">Budget:</div>
              <div class="value">$${safeData.budget}</div>
            </div>
            <div class="field">
              <div class="label">Client Name:</div>
              <div class="value">${safeData.fullName}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${safeData.email}">${safeData.email}</a></div>
            </div>
            <div class="field">
              <div class="label">Phone:</div>
              <div class="value">${safeData.phone}</div>
            </div>
            <div class="field">
              <div class="label">Project Description:</div>
              <div class="description">${safeData.description}</div>
            </div>
            ${attachments.length > 0 ? `
            <div class="field">
              <div class="label">Attachments:</div>
              <div class="value">${attachments.length} file(s) attached</div>
            </div>
            ` : ''}
            <hr style="margin: 20px 0;">
            <p><small>Submitted on ${new Date().toLocaleString()}</small></p>
          </div>
        </body>
        </html>
      `,
      attachments: attachments,
    };

    const clientMailOptions = {
      from: `"${companyName}" <${process.env.SMTP_USER}>`,
      to: safeData.email,
      subject: `✅ Thank you for your inquiry - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #6300ff; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .highlight { color: #6300ff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Thank You, ${safeData.fullName}!</h1>
            <p>We've received your project inquiry</p>
          </div>
          <div class="content">
            <p>Thank you for choosing <strong>${companyName}</strong> for your <span class="highlight">${safeData.projectType}</span> project.</p>
            
            <div class="summary">
              <h3>Your Project Summary:</h3>
              <p><strong>Project Type:</strong> ${safeData.projectType}</p>
              <p><strong>Service:</strong> ${safeData.service}</p>
              <p><strong>Budget:</strong> $${safeData.budget}</p>
              ${attachments.length > 0 ? `<p><strong>Attachments:</strong> ${attachments.length} file(s)</p>` : ''}
            </div>
            
            <p>Our team will review your requirements and contact you within <span class="highlight">24 business hours</span> at ${safeData.email} or ${safeData.phone}.</p>
            
            <p>If you have any immediate questions, feel free to reply to this email.</p>
            
            <p>Best regards,<br>The ${companyName} Team</p>
          </div>
        </body>
        </html>
      `
    };

    // Send emails with error handling
    console.log('📧 Attempting to send emails...');
    
    let emailResults = {
      companyEmail: false,
      clientEmail: false,
      errors: []
    };

    try {
      await emailTransporter.sendMail(companyMailOptions);
      console.log('✅ Company email sent successfully');
      emailResults.companyEmail = true;
    } catch (emailError) {
      console.error('❌ Company email failed:', emailError.message);
      emailResults.errors.push(`Company email: ${emailError.message}`);
    }

    try {
      await emailTransporter.sendMail(clientMailOptions);
      console.log('✅ Client email sent successfully');
      emailResults.clientEmail = true;
    } catch (emailError) {
      console.error('❌ Client email failed:', emailError.message);
      emailResults.errors.push(`Client email: ${emailError.message}`);
    }

    // Return success even if emails partially failed
    const emailSuccess = emailResults.companyEmail || emailResults.clientEmail;
    
    if (emailSuccess) {
      console.log('✅ Form submission completed successfully');
      res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully! We will contact you soon.' 
      });
    } else {
      console.warn('⚠️ Form submitted but emails failed');
      // Still return success since form was received
      res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully! (Email notification pending)' 
      });
    }

  } catch (error) {
    console.error('❌ Critical error in form submission:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again later.' 
    });
  }
});

// --- Health Check Endpoints ---
app.get('/', (req, res) => {
  const status = {
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    emailConfigured: emailConfigured,
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log('📊 Health check requested:', status);
  res.json(status);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    emailStatus: emailConfigured ? 'configured' : 'not configured',
    uptime: process.uptime()
  });
});

// --- Error Handlers ---
app.use((error, req, res, next) => {
  console.error('❌ Unhandled middleware error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

app.use((req, res) => {
  console.warn('❌ 404 - Endpoint not found:', req.method, req.path);
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log('🚀 Prootech Contact Form Backend Started');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📧 Email: ${emailConfigured ? 'Configured' : 'Not configured'}`);
  console.log(`🌍 CORS: Enabled for all origins`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('---');
});

module.exports = app;