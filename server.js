// server.js - Complete working version with proper email functionality
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intense')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'intense_beauty_academy_jwt_secret_2026';

// Email Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==================== USER SCHEMA WITH PASSWORD ====================
const userSchema = new mongoose.Schema({
    registrationId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    aadharNumber: { type: String, required: true, unique: true, match: [/^\d{12}$/, 'Aadhar number must be 12 digits'] },
    presentAddress: { type: String, required: true, trim: true },
    permanentAddress: { type: String, required: true, trim: true },
    dateOfJoin: { type: Date, required: true },
    packageDetails: { type: String, required: true },
    packageValue: { type: String },
    packagePrice: { type: String },
    packageDuration: { type: String },
    contactNumber: { type: String, required: true, match: [/^\d{10}$/, 'Contact number must be 10 digits'] },
    altContactNumber: { type: String, match: [/^\d{10}$/, 'Alternative number must be 10 digits'] },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isPasswordChanged: { type: Boolean, default: false },
    lastPasswordChange: { type: Date },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'active'], default: 'pending' },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Generate registration ID
userSchema.pre('save', async function(next) {
    if (this.isNew && !this.registrationId) {
        const prefix = 'IBA';
        const currentYear = new Date().getFullYear();
        const lastUser = await this.constructor.findOne(
            { registrationId: { $regex: `^${prefix}-STU-${currentYear}` } },
            { registrationId: 1 },
            { sort: { registrationId: -1 } }
        );
        let nextNumber = 1;
        if (lastUser && lastUser.registrationId) {
            const lastNumber = parseInt(lastUser.registrationId.split('-')[3]);
            nextNumber = lastNumber + 1;
        }
        this.registrationId = `${prefix}-STU-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

const User = mongoose.model('User', userSchema);

// ==================== ADMIN SCHEMA ====================
const adminSchema = new mongoose.Schema({
    employeeId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['super_admin', 'hr_manager', 'admin', 'employee'], default: 'employee' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    isPasswordChanged: { type: Boolean, default: false },
    phone: { type: String, trim: true, default: '' },
    department: { type: String, default: 'General' },
    salary: { type: String, default: '$0' },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
});

// Generate employee ID
adminSchema.pre('save', async function(next) {
    if (this.isNew && !this.employeeId) {
        const prefix = 'IBA';
        const currentYear = new Date().getFullYear();
        const lastAdmin = await this.constructor.findOne(
            { employeeId: { $regex: `^${prefix}-${currentYear}` } },
            { employeeId: 1 },
            { sort: { employeeId: -1 } }
        );
        let nextNumber = 1;
        if (lastAdmin && lastAdmin.employeeId) {
            const lastNumber = parseInt(lastAdmin.employeeId.split('-')[2]);
            nextNumber = lastNumber + 1;
        }
        this.employeeId = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    }
    next();
});

// Hash password middleware
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

const Admin = mongoose.model('Admin', adminSchema);

// ==================== HELPER FUNCTIONS ====================

// Generate random default password
const generateDefaultPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.random() * lowercase.length);
    password += numbers.charAt(Math.random() * numbers.length);
    password += special.charAt(Math.random() * special.length);
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 10; i++) {
        password += allChars.charAt(Math.random() * allChars.length);
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// ==================== EMAIL FUNCTIONS ====================

// Send welcome email to STUDENT (from /api/register)
const sendStudentWelcomeEmail = async (userData, defaultPassword) => {
    const { name, email, registrationId, packageDetails, dateOfJoin } = userData;
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Intense Beauty Academy</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .credentials { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .credential-item { margin: 12px 0; font-size: 16px; }
                .credential-label { font-weight: bold; color: #ff6b6b; min-width: 140px; display: inline-block; }
                .credential-value { font-family: monospace; font-size: 16px; background: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Intense Beauty Academy! 🎓</h1>
                    <p>Your registration has been confirmed</p>
                </div>
                <div class="content">
                    <h2>Dear ${name},</h2>
                    <p>Thank you for registering at Intense Beauty Academy. We are excited to have you on board!</p>
                    
                    <div class="credentials">
                        <h3>📋 Your Login Credentials:</h3>
                        <div class="credential-item">
                            <span class="credential-label">🆔 Registration ID:</span>
                            <span class="credential-value">${registrationId}</span>
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
                            <span class="credential-label">📚 Course Package:</span>
                            <span class="credential-value">${packageDetails}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">📅 Date of Joining:</span>
                            <span class="credential-value">${new Date(dateOfJoin).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important Security Notice:</strong>
                        <ul>
                            <li>This is your default password. Please change it after your first login.</li>
                            <li>Click the button below to login and change your password.</li>
                            <li>Never share your password with anyone.</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/student/login" class="button">🔐 Login to Student Portal</a>
                    </div>
                    
                    <p style="margin-top: 20px;"><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Login using your email and default password</li>
                        <li>You will be prompted to change your password on first login</li>
                        <li>Set a new strong password for your account</li>
                        <li>Access your courses and learning materials</li>
                    </ol>
                    
                    <p>For any queries, please contact us at support@intensebeautyacademy.com</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Welcome to Intense Beauty Academy - Your Login Credentials (ID: ${registrationId})`,
            html: emailHTML
        });
        console.log('✅ Student welcome email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Student email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email to ADMIN/EMPLOYEE (from /api/admins)
const sendAdminWelcomeEmail = async (userData, defaultPassword) => {
    const { name, email, role, employeeId } = userData;
    
    const roleDisplay = {
        'super_admin': 'Super Administrator',
        'hr_manager': 'HR Manager',
        'admin': 'Administrator',
        'employee': 'Employee'
    };
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Intense Beauty Academy - Staff Portal</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .credentials { background: #f0f4ff; border: 1px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .credential-item { margin: 12px 0; font-size: 16px; }
                .credential-label { font-weight: bold; color: #667eea; min-width: 140px; display: inline-block; }
                .credential-value { font-family: monospace; font-size: 16px; background: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Intense Beauty Academy! 👋</h1>
                    <p>Your staff account has been created</p>
                </div>
                <div class="content">
                    <h2>Dear ${name},</h2>
                    <p>Welcome to the Intense Beauty Academy team! Your staff account has been created successfully.</p>
                    
                    <div class="credentials">
                        <h3>📋 Your Account Details:</h3>
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
                        <ul>
                            <li>This is your default password. You must change it on first login.</li>
                            <li>Click the button below to login and set your new password.</li>
                            <li>Never share your credentials with anyone.</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/admin/login" class="button">🔐 Login to Staff Portal</a>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Login using your email and default password</li>
                        <li>You will be redirected to change your password on first login</li>
                        <li>Create a strong, secure password for your account</li>
                        <li>Complete your profile information</li>
                        <li>Access your dashboard based on your role permissions</li>
                    </ol>
                    
                    <p>For any queries, please contact the system administrator.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Welcome to Intense Beauty Academy - Your Staff Account (ID: ${employeeId})`,
            html: emailHTML
        });
        console.log('✅ Admin welcome email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Admin email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send password change confirmation email (for both student and admin after password change)
const sendPasswordChangeConfirmationEmail = async (email, name, userType = 'staff') => {
    const isStudent = userType === 'student';
    const loginUrl = isStudent ? 'http://localhost:5173/student/login' : 'http://localhost:5173/admin/login';
    const headerColor = isStudent ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' : 'linear-gradient(135deg, #667eea, #764ba2)';
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed Successfully</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .header { background: ${headerColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
                .info-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed Successfully! 🔐</h1>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2>Dear ${name},</h2>
                    <p>Your password has been successfully changed.</p>
                    
                    <div class="info-box">
                        <strong>📋 What's Next:</strong>
                        <ul>
                            <li>Use your new password for all future logins</li>
                            <li>Keep your password secure and don't share it with anyone</li>
                            <li>If you didn't make this change, please contact support immediately</li>
                        </ul>
                    </div>
                    
                    <p><strong>Security Tips:</strong></p>
                    <ul>
                        <li>Never share your password via email or phone</li>
                        <li>Use a unique password that you don't use elsewhere</li>
                        <li>Change your password periodically for better security</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="${loginUrl}" class="button">Login with New Password</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        This email confirms that your password was changed on ${new Date().toLocaleString()}.
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Changed Successfully - Intense Beauty Academy',
            html: emailHTML
        });
        console.log(`✅ Password change confirmation email sent to ${userType}:`, email);
        return { success: true };
    } catch (error) {
        console.error('❌ Password change email sending failed:', error);
        return { success: false };
    }
};

// ==================== REGISTRATION API (STUDENT) ====================

app.post('/api/register', async (req, res) => {
    try {
        const {
            name,
            fatherName,
            dateOfBirth,
            aadharNumber,
            presentAddress,
            permanentAddress,
            dateOfJoin,
            packageDetails,
            packageValue,
            packagePrice,
            packageDuration,
            contactNumber,
            altContactNumber,
            email
        } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { aadharNumber }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or Aadhar number already exists'
            });
        }
        
        // Generate default password
        const defaultPassword = generateDefaultPassword();
        
        // Create new user with password
        const user = new User({
            name,
            fatherName,
            dateOfBirth: new Date(dateOfBirth),
            aadharNumber,
            presentAddress,
            permanentAddress,
            dateOfJoin: new Date(dateOfJoin),
            packageDetails,
            packageValue,
            packagePrice,
            packageDuration,
            contactNumber,
            altContactNumber,
            email: email.toLowerCase(),
            password: defaultPassword,
            isPasswordChanged: false,
            status: 'pending'
        });
        
        await user.save();
        
        // Send welcome email to student
        await sendStudentWelcomeEmail({
            name,
            email,
            registrationId: user.registrationId,
            packageDetails,
            dateOfJoin
        }, defaultPassword);
        
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'Registration successful! Login credentials sent to your email.',
            data: {
                registrationId: userResponse.registrationId,
                name: userResponse.name,
                email: userResponse.email,
                packageDetails: userResponse.packageDetails,
                dateOfJoin: userResponse.dateOfJoin,
                status: userResponse.status
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
});

// ==================== CREATE ADMIN API ====================

app.post('/api/admins', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }
        
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Map role from UI to database enum
        let dbRole = 'employee';
        switch(role) {
            case 'super_admin':
            case 'Super Admin':
                dbRole = 'super_admin';
                break;
            case 'hr_manager':
            case 'HR Manager':
                dbRole = 'hr_manager';
                break;
            case 'admin':
            case 'Admin':
                dbRole = 'admin';
                break;
            case 'employee':
            case 'Employee':
                dbRole = 'employee';
                break;
            default:
                dbRole = role || 'employee';
        }
        
        const defaultPassword = generateDefaultPassword();
        
        const admin = new Admin({ 
            name, 
            email, 
            password: defaultPassword, 
            role: dbRole,
            isActive: true,
            isPasswordChanged: false
        });
        
        await admin.save();
        
        // Send welcome email to admin/employee
        await sendAdminWelcomeEmail({
            name,
            email,
            role: dbRole,
            employeeId: admin.employeeId
        }, defaultPassword);
        
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'User created successfully. Login credentials sent to email.',
            data: adminResponse
        });
        
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// ==================== STUDENT FIRST-TIME PASSWORD CHANGE ====================

app.post('/api/student/first-time-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login again.'
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role !== 'student') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Student only endpoint.'
                });
            }
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        const { newPassword, confirmPassword } = req.body;
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        const user = await User.findById(decoded.id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update password
        user.password = newPassword;
        user.isPasswordChanged = true;
        user.lastPasswordChange = new Date();
        await user.save();
        
        // Send confirmation email
        await sendPasswordChangeConfirmationEmail(user.email, user.name, 'student');
        
        console.log(`✅ Student first-time password changed for: ${user.email}`);
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully! Please login with your new password.'
        });
        
    } catch (error) {
        console.error('Student first-time password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

// ==================== ADMIN FIRST-TIME PASSWORD CHANGE ====================

app.post('/api/admin/first-time-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login again.'
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.type !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only endpoint.'
                });
            }
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        const { newPassword, confirmPassword } = req.body;
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain uppercase, lowercase, number, and special character'
            });
        }
        
        const admin = await Admin.findById(decoded.id).select('+password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        // Update password
        admin.password = newPassword;
        admin.isPasswordChanged = true;
        admin.lastPasswordChange = new Date();
        await admin.save();
        
        // Send confirmation email
        await sendPasswordChangeConfirmationEmail(admin.email, admin.name, 'staff');
        
        console.log(`✅ Admin first-time password changed for: ${admin.email}`);
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully! Please login with your new password.'
        });
        
    } catch (error) {
        console.error('Admin first-time password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

// ==================== STUDENT LOGIN API ====================

// app.post('/api/user/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide email and password'
//             });
//         }
        
//         const user = await User.findOne({ email }).select('+password');
        
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         const isPasswordValid = await user.comparePassword(password);
        
//         if (!isPasswordValid) {
//             user.loginAttempts = (user.loginAttempts || 0) + 1;
//             if (user.loginAttempts >= 5) {
//                 user.lockUntil = Date.now() + 30 * 60 * 1000;
//                 await user.save();
//                 return res.status(401).json({
//                     success: false,
//                     message: 'Account locked due to multiple failed attempts'
//                 });
//             }
//             await user.save();
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         // Reset login attempts
//         user.loginAttempts = 0;
//         user.lockUntil = undefined;
//         await user.save();
        
//         const token = jwt.sign(
//             { id: user._id, email: user.email, role: 'student', registrationId: user.registrationId },
//             JWT_SECRET,
//             { expiresIn: '7d' }
//         );
        
//         const userData = user.toObject();
//         delete userData.password;
        
//         res.status(200).json({
//             success: true,
//             message: 'Login successful',
//             data: { 
//                 user: userData, 
//                 token,
//                 requiresPasswordChange: !user.isPasswordChanged
//             }
//         });
        
//     } catch (error) {
//         console.error('User login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error logging in',
//             error: error.message
//         });
//     }
// });

app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 30 * 60 * 1000;
                await user.save();
                return res.status(401).json({
                    success: false,
                    message: 'Account locked due to multiple failed attempts'
                });
            }
            await user.save();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Reset login attempts
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, email: user.email, role: 'student', registrationId: user.registrationId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const userData = user.toObject();
        delete userData.password;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                user: userData, 
                token,
                requiresPasswordChange: !user.isPasswordChanged  // Important flag
            }
        });
        
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// ==================== ADMIN LOGIN API ====================

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        const isPasswordValid = await admin.comparePassword(password);
        
        if (!isPasswordValid) {
            admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            if (admin.loginAttempts >= 5) {
                admin.lockUntil = Date.now() + 30 * 60 * 1000;
                await admin.save();
                return res.status(401).json({
                    success: false,
                    message: 'Account locked due to multiple failed attempts'
                });
            }
            await admin.save();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Reset login attempts
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role, type: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const adminData = admin.toObject();
        delete adminData.password;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                admin: adminData, 
                token,
                requiresPasswordChange: !admin.isPasswordChanged
            }
        });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// ==================== OTHER API ENDPOINTS ====================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        timestamp: new Date()
    });
});

// Get all admins
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password -loginAttempts -lockUntil').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Get all students
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`\n📧 Email Configuration: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`\n👤 Student APIs:`);
    console.log(`   POST   /api/register - Register new student`);
    console.log(`   POST   /api/user/login - Student login`);
    console.log(`   POST   /api/student/first-time-password - Student first-time password change`);
    console.log(`\n👨‍💼 Admin APIs:`);
    console.log(`   POST   /api/admins - Create admin/employee`);
    console.log(`   POST   /api/login - Admin login`);
    console.log(`   POST   /api/admin/first-time-password - Admin first-time password change`);
    console.log(`   GET    /api/admins - Get all admins`);
    console.log(`   GET    /api/users - Get all students\n`);
});