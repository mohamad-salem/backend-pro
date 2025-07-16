// server-fixed.js - نسخة محسنة مع معالجة أفضل للأخطاء
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Logging Middleware ---
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- Error Handling ---
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- Nodemailer Setup with Better Error Handling ---
let transporter = null;

function setupEmailTransporter() {
  try {
    // Check for required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`Warning: Missing SMTP environment variables: ${missingVars.join(', ')}`);
      console.warn('Email functionality will be disabled');
      return null;
    }

    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // للتطوير فقط
      }
    });

    // Test the connection
    transporter.verify()
      .then(() => {
        console.log('✅ Email transporter is ready');
      })
      .catch(err => {
        console.error('❌ Email transporter verification failed:', err.message);
        transporter = null;
      });

    return transporter;
  } catch (error) {
    console.error('❌ Error setting up email transporter:', error.message);
    return null;
  }
}

// Initialize email transporter
setupEmailTransporter();

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

// --- Main API Endpoint ---
app.post('/submit', async (req, res) => {
  try {
    console.log('📝 Received form submission:', req.body);

    // Extract and validate data
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

    // Validation
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
      if (!req.body[field] || req.body[field].trim() === '') {
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

    if (!validateEmail(email)) {
      console.warn('❌ Validation failed - invalid email:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Sanitize data
    const safeData = {
      projectType: escapeHtml(projectType.trim()),
      service: escapeHtml(service.trim()),
      fullName: escapeHtml(fullName.trim()),
      email: escapeHtml(email.trim().toLowerCase()),
      phone: escapeHtml(phone.trim()),
      description: escapeHtml(description.trim()),
      budget: escapeHtml(budget.trim()),
    };

    console.log('✅ Data validated and sanitized:', safeData);

    // Process attachments
    const attachments = Array.isArray(files) ? files
      .filter(file => file && file.dataUrl && file.name)
      .map(file => ({
        filename: escapeHtml(file.name),
        path: file.dataUrl
      })) : [];

    console.log(`📎 Processed ${attachments.length} attachments`);

    // Email configuration
    const companyEmail = process.env.COMPANY_EMAIL || 'info@prootech-agency.com';
    const companyName = process.env.COMPANY_NAME || 'Prootech Agency';

    // If email is not configured, still return success but log warning
    if (!transporter) {
      console.warn('⚠️ Email not configured - form data received but emails not sent');
      console.log('Form data would be:', safeData);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully (email disabled in development)' 
      });
    }

    // Prepare emails
    const companyMailOptions = {
      from: `"${safeData.fullName} via Prootech Form" <${process.env.SMTP_USER}>`,
      to: companyEmail,
      replyTo: safeData.email,
      subject: `🚀 New ${safeData.projectType} Project - ${safeData.fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6300ff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #6300ff; }
            .value { margin-top: 5px; }
            .description { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #6300ff; }
          </style>
        </head>
        <body>
          <div class="container">
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6300ff; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .highlight { color: #6300ff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
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
          </div>
        </body>
        </html>
      `
    };

    // Send emails
    console.log('📧 Sending emails...');
    
    try {
      await transporter.sendMail(companyMailOptions);
      console.log('✅ Company email sent successfully');
      
      await transporter.sendMail(clientMailOptions);
      console.log('✅ Client email sent successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully! We will contact you soon.' 
      });
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      
      // Still return success since form was received, but log the email error
      res.status(200).json({ 
        success: true, 
        message: 'Form submitted successfully! (Email notification pending)' 
      });
    }

  } catch (error) {
    console.error('❌ Server error in /submit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again later.' 
    });
  }
});

// --- Health Check Endpoint ---
app.get('/', (req, res) => {
  const status = {
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    emailConfigured: !!transporter
  };
  
  res.json(status);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    emailStatus: transporter ? 'configured' : 'not configured'
  });
});

// --- Error Handler ---
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log('🚀 Prootech Form Backend Started');
  console.log(`📍 Server running at http://localhost:${port}`);
  console.log(`📧 Email configured: ${transporter ? 'Yes' : 'No'}`);
  console.log(`🌍 CORS enabled for all origins`);
  console.log('---');
});

module.exports = app;