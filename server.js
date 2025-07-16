// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Nodemailer Setup
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("FATAL ERROR: Missing SMTP credentials!");
    process.exit(1);
}
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
transporter.verify()
  .then(() => console.log("Email transporter ready"))
  .catch(err => console.error("Email setup error:", err));

// Helper functions
const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// API Endpoint
app.post('/submit', async (req, res) => {
  const {
    projectType = '', service = '', fullName = '', email = '',
    phone = '', description = '', budget = '', files = []
  } = req.body;

  // Validation
  const requiredFields = ['projectType', 'service', 'fullName', 'email', 'phone', 'description', 'budget'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }
  
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  // Sanitization
  const safeData = {
    projectType: escapeHtml(projectType.trim()),
    service: escapeHtml(service.trim()),
    fullName: escapeHtml(fullName.trim()),
    email: escapeHtml(email.trim().toLowerCase()),
    phone: escapeHtml(phone.trim()),
    description: escapeHtml(description.trim()),
    budget: escapeHtml(budget.trim()),
  };

  // Attachments
  const attachments = files
    .filter(file => file && file.dataUrl && file.name)
    .map(file => ({
        filename: file.name,
        path: file.dataUrl
    }));

  // Email Configuration
  const companyEmail = process.env.COMPANY_EMAIL;
  const companyName = process.env.COMPANY_NAME || 'Prootech Agency';
  const primaryColor = '#6300ff';
  const secondaryColor = '#000000';
  const logoUrl = 'https://prootech-agency.com/assets/header-logo/Prootech%20(3).png '; // Replace with your logo

  // --- Minimal & Professional Email Design ---

  // 1. Email to Company
  const companyMailOptions = {
    from: `"Prootech Form" <${process.env.SMTP_USER}>`,
    to: companyEmail,
    replyTo: safeData.email,
    subject: `New Project: ${safeData.projectType}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Inquiry</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    }
    
    body { 
      background-color: #f8f9fa; 
      padding: 24px; 
      color: #333;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
    }
    
    .header {
      background: ${primaryColor};
      padding: 32px 24px;
      text-align: center;
    }
    
    .logo {
      height: 48px;
      margin-bottom: 16px;
    }
    
    .title {
      color: white;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.85);
      font-size: 16px;
    }
    
    .card {
      padding: 32px;
      border-bottom: 1px solid #eee;
    }
    
    .section-title {
      color: ${primaryColor};
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .info-item {
      margin-bottom: 16px;
    }
    
    .info-label {
      color: #666;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .info-value {
      color: ${secondaryColor};
      font-size: 16px;
      font-weight: 500;
    }
    
    .description {
      background: #fafbff;
      border-radius: 8px;
      padding: 20px;
      margin-top: 8px;
      line-height: 1.6;
    }
    
    .attachments {
      margin-top: 20px;
    }
    
    .attachment-tag {
      display: inline-block;
      background: #f5f7ff;
      border: 1px solid #e6ebff;
      border-radius: 6px;
      padding: 8px 16px;
      margin-right: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .footer {
      padding: 24px;
      text-align: center;
      background: #f9fafb;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Prootech Logo" class="logo">
      <h1 class="title">New Project Inquiry</h1>
      <p class="subtitle">From ${safeData.fullName}</p>
    </div>
    
    <div class="card">
      <h2 class="section-title">Project Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Project Type</div>
          <div class="info-value">${safeData.projectType}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Service</div>
          <div class="info-value">${safeData.service}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Budget</div>
          <div class="info-value">${safeData.budget}</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title">Client Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${safeData.fullName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${safeData.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${safeData.phone}</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="section-title">Project Description</h2>
      <div class="description">
        ${safeData.description}
      </div>
      
      ${attachments.length > 0 ? `
      <div class="attachments">
        <h2 class="section-title">Attachments</h2>
        <div>
          ${attachments.map(file => `
            <span class="attachment-tag">${file.filename}</span>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Submitted via Prootech Website • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
    `,
    attachments: attachments,
  };

  // 2. Email to Client
  const clientMailOptions = {
    from: `"${companyName}" <${process.env.SMTP_USER}>`,
    to: safeData.email,
    subject: `Thank you for your inquiry - Prootech Agency`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    }
    
    body { 
      background-color: #f8f9fa; 
      padding: 24px; 
      color: #333;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
    }
    
    .header {
      background: ${primaryColor};
      padding: 40px 24px;
      text-align: center;
    }
    
    .logo {
    height: 100px;
    filter: invert(1);
          margin-bottom: 20px;
    }
    
    .title {
      color: white;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 18px;
    }
    
    .content {
      padding: 40px 32px;
      text-align: center;
    }
    
    .thank-you {
      font-size: 24px;
      font-weight: 500;
      color: ${secondaryColor};
      margin-bottom: 24px;
    }
    
    .message {
      font-size: 17px;
      line-height: 1.7;
      color: #555;
      margin-bottom: 32px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .highlight {
      color: ${primaryColor};
      font-weight: 600;
    }
    
    .summary-box {
      background: #fafbff;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      text-align: left;
      border: 1px solid #f0f2ff;
    }
    
    .summary-title {
      color: ${primaryColor};
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .summary-item {
      display: flex;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .summary-label {
      flex: 1;
      color: #666;
      font-weight: 500;
    }
    
    .summary-value {
      flex: 1;
      color: ${secondaryColor};
      font-weight: 500;
    }
    
    .contact {
      margin-top: 40px;
    }
    
    .contact-title {
      font-size: 20px;
      font-weight: 600;
      color: ${secondaryColor};
      margin-bottom: 20px;
    }
    
    .contact-info {
      font-size: 17px;
      margin-bottom: 12px;
    }
    
    .footer {
      padding: 24px;
      text-align: center;
      background: #f9fafb;
      color: #777;
      font-size: 14px;
      border-top: 1px solid #eee;
    }
    
    .social {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 16px;
    }
    
    .social-link {
      color: ${primaryColor};
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Prootech Logo" class="logo">
      <h1 class="title">Thank You, ${safeData.fullName}</h1>
      <p class="subtitle">We've received your project details</p>
    </div>
    
    <div class="content">
      <div class="thank-you">We appreciate your interest in Prootech</div>
      
      <p class="message">
        Thank you for choosing us for your <span class="highlight">${safeData.projectType}</span> project. 
        Our team is reviewing your requirements and will contact you within 
        <span class="highlight">24 business hours</span>.
      </p>
      
      <div class="summary-box">
        <h3 class="summary-title">Project Summary</h3>
        
        <div class="summary-item">
          <div class="summary-label">Project Type:</div>
          <div class="summary-value">${safeData.projectType}</div>
        </div>
        
        <div class="summary-item">
          <div class="summary-label">Service:</div>
          <div class="summary-value">${safeData.service}</div>
        </div>
        
        <div class="summary-item">
          <div class="summary-label">Budget:</div>
          <div class="summary-value">${safeData.budget}</div>
        </div>
        
        ${attachments.length > 0 ? `
        <div class="summary-item">
          <div class="summary-label">Attachments:</div>
          <div class="summary-value">${attachments.length} file(s)</div>
        </div>
        ` : ''}
      </div>
      
      <div class="contact">
        <h3 class="contact-title">Need immediate assistance?</h3>
        <p class="contact-info">Email: ${companyEmail}</p>
        <p class="contact-info">Phone: ${process.env.COMPANY_PHONE || '+123 456 7890'}</p>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Prootech Agency. All rights reserved.</p>
     
    </div>
  </div>
</body>
</html>
    `
  };

  // Send emails
  try {
    await transporter.sendMail(companyMailOptions);
    await transporter.sendMail(clientMailOptions);
    res.status(200).json({ success: true, message: 'Submission successful. Emails sent.' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'Error processing submission.' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Prootech Agency Form Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start Server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

// Export for Vercel
module.exports = app;