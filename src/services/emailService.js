// services/emailService.js
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Generate random default password
const generateDefaultPassword = () => {
    const length = 10;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Send welcome email with credentials
const sendWelcomeEmail = async (userData, defaultPassword) => {
    const { name, email, role, employeeId } = userData;
    
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    // Role display mapping
    const roleDisplay = {
        'super_admin': 'Super Administrator',
        'hr_manager': 'HR Manager',
        'admin': 'Admin',
        'employee': 'Employee'
    };
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Intense Beauty Academy</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .credentials {
                    background: #f0f4ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }
                .credential-item {
                    margin: 12px 0;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .credential-label {
                    font-weight: bold;
                    color: #667eea;
                    min-width: 120px;
                }
                .credential-value {
                    font-family: monospace;
                    font-size: 16px;
                    background: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    display: inline-block;
                    margin-left: 10px;
                    font-weight: bold;
                }
                .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    color: #999;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-size: 14px;
                }
                .success-icon {
                    font-size: 48px;
                    text-align: center;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Intense Beauty Academy!</h1>
                    <p>Your account has been created successfully</p>
                </div>
                
                <div class="content">
                    <div class="success-icon">🎉</div>
                    
                    <h2>Hello ${name},</h2>
                    <p>We are excited to have you on board! Your account has been created with the following credentials:</p>
                    
                    <div class="credentials">
                        <div class="credential-item">
                            <span class="credential-label">🆔 Employee ID:</span>
                            <span class="credential-value">${employeeId}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">📧 Email:</span>
                            <span class="credential-value">${email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">🔑 Default Password:</span>
                            <span class="credential-value">${defaultPassword}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">👔 Role:</span>
                            <span class="credential-value">${roleDisplay[role] || role}</span>
                        </div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important Security Notice:</strong>
                        <ul style="margin-top: 10px; margin-bottom: 0;">
                            <li>This is your default password. Please change it after your first login.</li>
                            <li>Never share your password with anyone.</li>
                            <li>Keep your Employee ID for future reference.</li>
                            <li>If you didn't request this account, contact administrator immediately.</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${loginUrl}" class="button">🔐 Login to Your Account</a>
                    </div>
                    
                    <p style="margin-top: 20px;">
                        <strong>Getting Started:</strong><br>
                        1️⃣ Click the login button above<br>
                        2️⃣ Enter your email and the default password<br>
                        3️⃣ You'll be prompted to change your password<br>
                        4️⃣ Complete your profile information
                    </p>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                    <p>For assistance, contact IT Support: support@beautyacademy.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const mailOptions = {
        from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to Intense Beauty Academy - Your Account Credentials (ID: ${employeeId})`,
        html: emailHTML
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', email);
        console.log('📧 Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    generateDefaultPassword,
    sendWelcomeEmail
};