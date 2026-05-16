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

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
    registrationId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    aadharNumber: { type: String, required: true, unique: true },
    presentAddress: { type: String, required: true, trim: true },
    permanentAddress: { type: String, required: true, trim: true },
    dateOfJoin: { type: Date, required: true },
    packageDetails: { type: String, required: true },
    packageValue: { type: String },
    packagePrice: { type: String },
    dueAmount: { type: Number, default: 0 },
    packageDuration: { type: String },
    contactNumber: { type: String, required: true },
    altContactNumber: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isPasswordChanged: { type: Boolean, default: false },
    lastPasswordChange: { type: Date },
    paymentStatus: { 
        type: String, 
        enum: ['completed', 'pending', 'failed'], 
        default: 'pending' 
    },
    paymentDate: { type: Date, default: null },
    paymentMethod: { 
        type: String,
        set: v => v ? (v.toUpperCase() === 'UPI' ? 'UPI' : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()) : v,
        enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'UPI'],
        default: null
    },
    transactionId: { 
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        default: null
    },
    paymentAmount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'active'], 
        default: 'pending' 
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Student Progress Schema
const studentProgressSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registrationId: { type: String, required: true },
    courseProgress: {
        completed: { type: Number, default: 0 },
        totalModules: { type: Number, default: 0 },
        completedModules: { type: Number, default: 0 },
        currentModule: { type: String, default: "" },
        nextModule: { type: String, default: "" },
        assignments: { type: Number, default: 0 },
        completedAssignments: { type: Number, default: 0 },
        moduleProgress: [{
            moduleName: String,
            moduleNumber: Number,
            isCompleted: { type: Boolean, default: false },
            completedAt: Date,
            score: { type: Number, default: 0 }
        }]
    },
    achievementPoints: { type: Number, default: 0 },
    certificateStatus: { type: String, enum: ['Not Started', 'In Progress', 'Eligible', 'Issued'], default: 'Not Started' },
    recentActivities: [{
        activity: String,
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['module', 'assignment', 'security', 'achievement'] }
    }],
    lastUpdated: { type: Date, default: Date.now }
});

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, required: true },
    assignmentName: { type: String, required: true },
    description: String,
    dueDate: Date,
    submittedAt: Date,
    status: { type: String, enum: ['pending', 'submitted', 'graded', 'late'], default: 'pending' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: String,
    points: { type: Number, default: 0 }
});

// Module Completion Schema
const moduleCompletionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, required: true },
    moduleName: { type: String, required: true },
    moduleNumber: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
});

// Admin Schema

const adminSchema = new mongoose.Schema({
    employeeId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true,
        select: false 
    },
    role: { 
        type: String, 
        enum: ['super_admin', 'hr_manager', 'admin', 'employee'], 
        default: 'employee' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastLogin: { 
        type: Date 
    },
    isPasswordChanged: { 
        type: Boolean, 
        default: false 
    },
    phone: { 
        type: String, 
        trim: true, 
        default: '' 
    },
    department: { 
        type: String, 
        default: 'General' 
    },
    salary: { 
        type: String, 
        default: '$0' 
    },
    loginAttempts: { 
        type: Number, 
        default: 0 
    },
    lockUntil: { 
        type: Date 
    },
    lastPasswordChange: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving


// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate employee ID
adminSchema.pre('save', async function(next) {
    if (!this.employeeId && this.role !== 'super_admin') {
        const prefix = this.role === 'hr_manager' ? 'HR' : 'EMP';
        const count = await mongoose.model('Admin').countDocuments({ role: this.role });
        this.employeeId = `${prefix}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});



// Notification Schema
const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    recipientRole: { type: String, enum: ['super_admin', 'hr_manager', 'admin'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['registration', 'approval', 'rejection', 'system', 'password_change'], default: 'registration' },
    relatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Approval History Schema
const approvalHistorySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    action: { type: String, enum: ['approved', 'rejected', 'pending'], required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedByName: { type: String },
    approvedByRole: { type: String },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Payment Schema
// Updated Payment Schema with dueAmount field
const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    registrationId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },  // ✅ New field
    paymentDate: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['completed', 'pending', 'failed', 'partial'], 
        default: 'pending' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'UPI'], 
        required: true 
    },
    transactionId: { type: String, unique: true, sparse: true },
    remarks: { type: String },
    coursePackage: { type: String },  // ✅ New field
    packagePrice: { type: Number, default: 0 },  // ✅ New field
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add index for better query performance
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ registrationId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `₹${this.amount.toLocaleString()}`;
});

// Virtual for formatted due amount
paymentSchema.virtual('formattedDueAmount').get(function() {
    return `₹${this.dueAmount.toLocaleString()}`;
});

// Method to update payment status based on amount and due amount
paymentSchema.methods.updatePaymentStatus = function() {
    if (this.dueAmount <= 0) {
        this.status = 'completed';
    } else if (this.amount > 0 && this.dueAmount > 0) {
        this.status = 'partial';
    } else if (this.amount === 0) {
        this.status = 'pending';
    }
    return this.status;
};


// Add index for better query performance
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ registrationId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `₹${this.amount.toLocaleString()}`;
});

// Virtual for formatted due amount
paymentSchema.virtual('formattedDueAmount').get(function() {
    return `₹${this.dueAmount.toLocaleString()}`;
});

// Method to update payment status based on amount and due amount
paymentSchema.methods.updatePaymentStatus = function() {
    if (this.dueAmount <= 0) {
        this.status = 'completed';
    } else if (this.amount > 0 && this.dueAmount > 0) {
        this.status = 'partial';
    } else if (this.amount === 0) {
        this.status = 'pending';
    }
    return this.status;
};

// ==================== PRE-SAVE HOOKS ====================

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

// ==================== METHODS ====================

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ==================== MODELS ====================

const User = mongoose.model('User', userSchema);
const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const ModuleCompletion = mongoose.model('ModuleCompletion', moduleCompletionSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const ApprovalHistory = mongoose.model('ApprovalHistory', approvalHistorySchema);
const Payment = mongoose.model('Payment', paymentSchema);

// ==================== HELPER FUNCTIONS ====================

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
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Add timeout to avoid hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Function to send email
const sendAdminCredentialsEmail = async (name, email, defaultPassword, role) => {
    try {
        const mailOptions = {
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Intense Beauty Academy - Your Admin Credentials',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #FF6B9D, #FF4D7D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B9D; }
                        .password { font-size: 20px; font-weight: bold; color: #FF6B9D; background: #f0f0f0; padding: 10px; text-align: center; border-radius: 5px; letter-spacing: 2px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
                        .button { display: inline-block; background: #FF6B9D; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Welcome to Intense Beauty Academy!</h2>
                        </div>
                        <div class="content">
                            <h3>Hello ${name},</h3>
                            <p>Your admin account has been created successfully with the following credentials:</p>
                            
                            <div class="credentials">
                                <p><strong>📧 Email:</strong> ${email}</p>
                                <p><strong>👤 Role:</strong> ${role}</p>
                                <p><strong>🔐 Default Password:</strong></p>
                                <div class="password">${defaultPassword}</div>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong>
                                <ul style="margin: 10px 0 0 20px;">
                                    <li>This is a system-generated password</li>
                                    <li>Please change your password after first login</li>
                                    <li>Do not share these credentials with anyone</li>
                                </ul>
                            </div>
                            
                            <p>You can now login to your admin panel:</p>
                            <a href="${process.env.ADMIN_LOGIN_URL || 'https://yourdomain.com/admin/login'}" class="button">Login to Admin Panel</a>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply.</p>
                            <p>&copy; 2024 Intense Beauty Academy. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Welcome to Intense Beauty Academy!\n\nHello ${name},\n\nYour admin account has been created.\n\nEmail: ${email}\nRole: ${role}\nDefault Password: ${defaultPassword}\n\nPlease change your password after first login.\n\nLogin here: ${process.env.ADMIN_LOGIN_URL || 'https://yourdomain.com/admin/login'}`
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

// Send welcome email to student with registration details
const sendStudentWelcomeEmail = async (userData, defaultPassword) => {
    try {
        const { name, email, registrationId, packageDetails, packagePrice, paymentAmount, dueAmount, dateOfJoin } = userData;
        
        // Format dates safely
        const formattedDateOfJoin = dateOfJoin ? new Date(dateOfJoin).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : 'Not specified';
        
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Intense Beauty Academy</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .header {
    background: linear-gradient(135deg, #4b0082 0%, #8a2be2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
}
                    .header h1 {
                        font-size: 28px;
                        margin-bottom: 10px;
                    }
                    .header p {
                        font-size: 16px;
                        opacity: 0.95;
                    }
                    .content {
                        padding: 40px 30px;
                        background: #ffffff;
                    }
                    .credentials {
                        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #ff6b6b;
                    }
                    .credentials h3 {
                        color: #856404;
                        margin-bottom: 15px;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                    }
                    .details h3 {
                        color: #ff6b6b;
                        margin-bottom: 15px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #555;
                    }
                    .info-value {
                        color: #333;
                    }
                    .payment-status {
                        display: inline-block;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .status-paid {
                        background: #d4edda;
                        color: #155724;
                    }
                    .status-partial {
                        background: #fff3cd;
                        color: #856404;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 35px;
                        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                        color: white;
                        text-decoration: none;
                        border-radius: 50px;
                        margin-top: 25px;
                        font-weight: bold;
                        transition: transform 0.3s ease;
                    }
                    .button:hover {
                        transform: translateY(-2px);
                    }
                    .warning-box {
                        background: #fff3cd;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #ffc107;
                    }
                    .warning-box h4 {
                        color: #856404;
                        margin-bottom: 10px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #e0e0e0;
                    }
                    code {
                        background: #f4f4f4;
                        padding: 3px 8px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-size: 14px;
                        color: #d63384;
                    }
                    @media (max-width: 480px) {
                        .header h1 { font-size: 22px; }
                        .content { padding: 25px 20px; }
                        .info-row { flex-direction: column; }
                        .info-value { margin-top: 5px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Welcome to Intense Beauty Academy!</h1>
                        <p>Your Journey to Excellence Begins Here</p>
                    </div>
                    <div class="content">
                        <h2>Dear ${name},</h2>
                        <p>Thank you for choosing Intense Beauty Academy! We're thrilled to have you as part of our family. Your registration has been successfully completed.</p>
                        
                        <div class="credentials">
                            <h3>📋 Your Login Credentials</h3>
                            <div class="info-row">
                                <span class="info-label">Registration ID:</span>
                                <span class="info-value"><strong>${registrationId}</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${email}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Temporary Password:</span>
                                <span class="info-value"><code>${defaultPassword}</code></span>
                            </div>
                            <p style="margin-top: 15px; color: #856404; font-size: 14px;">
                                <strong>⚠️ Important:</strong> Please change your password immediately after first login for security reasons.
                            </p>
                        </div>
                        
                        <div class="details">
                            <h3>📚 Course Enrollment Details</h3>
                            <div class="info-row">
                                <span class="info-label">Course Package:</span>
                                <span class="info-value">${packageDetails || 'Not specified'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date of Joining:</span>
                                <span class="info-value">${formattedDateOfJoin}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Total Package Price:</span>
                                <span class="info-value">${packagePrice || '₹0'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Amount Paid:</span>
                                <span class="info-value">₹${(paymentAmount || 0).toLocaleString()}</span>
                            </div>
                            ${dueAmount > 0 ? `
                            <div class="info-row">
                                <span class="info-label">Due Amount:</span>
                                <span class="info-value">₹${dueAmount.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            <div class="info-row">
                                <span class="info-label">Payment Status:</span>
                                <span class="info-value">
                                    <span class="payment-status ${dueAmount === 0 ? 'status-paid' : 'status-partial'}">
                                        ${dueAmount === 0 ? '✅ Fully Paid' : '⏳ Partially Paid'}
                                    </span>
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/user/login" class="button">🚀 Login to Student Portal</a>
                        </div>
                        
                        <div class="warning-box">
                            <h4>📝 Next Steps:</h4>
                            <ol style="margin-left: 20px;">
                                <li>Login using your Registration ID/Email and temporary password</li>
                                <li>Change your password immediately after first login</li>
                                <li>Complete your profile and explore the course content</li>
                                <li>Contact our support team for any assistance</li>
                            </ol>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>For support, contact: support@intensebeautyacademy.com</p>
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Verify email configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials not configured in .env file');
            return { success: false, error: 'Email credentials missing' };
        }
        
        const mailOptions = {
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🎓 Welcome to Intense Beauty Academy - Login Credentials (ID: ${registrationId})`,
            html: emailHTML,
            // Add text version as fallback
            text: `Welcome to Intense Beauty Academy!\n\nRegistration ID: ${registrationId}\nEmail: ${email}\nTemporary Password: ${defaultPassword}\n\nPlease login at: http://localhost:5173/user/login`
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', email, 'Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('❌ Welcome email failed - Detailed error:', error.message);
        console.error('Error code:', error.code);
        console.error('Command:', error.command);
        return { success: false, error: error.message };
    }
};


// Send email for password change confirmation
const sendPasswordChangeConfirmation = async (userData) => {
    try {
        const { name, email, registrationId } = userData;
        
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Password Changed Successfully</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .header {
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .alert-box {
                        background: #d4edda;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #28a745;
                    }
                    .warning-box {
                        background: #fff3cd;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #ffc107;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 35px;
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: bold;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Changed Successfully!</h1>
                    </div>
                    <div class="content">
                        <h2>Dear ${name},</h2>
                        <div class="alert-box">
                            <p>✅ Your account password has been successfully changed.</p>
                            <p><strong>Registration ID:</strong> ${registrationId}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Changed On:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div class="warning-box">
                            <p><strong>⚠️ Security Alert:</strong> If you did NOT change your password, please contact our support team immediately.</p>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/user/login" class="button">Login to Your Account</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🔐 Password Changed Successfully - ${registrationId}`,
            html: emailHTML
        });
        console.log('✅ Password change confirmation email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Password change email failed:', error);
        return { success: false, error: error.message };
    }
};
const sendAdminPasswordChangeConfirmation = async (adminData) => {
    try {
        const { name, email, employeeId, role } = adminData;
        
        const mailOptions = {
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Changed Successfully - Intense Beauty Academy',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Changed Successfully</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 30px; text-align: center; }
                        .content { padding: 30px; }
                        .alert-box { background: #d4edda; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f9f9f9; }
                        .button { display: inline-block; background: #27ae60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🔐 Password Changed Successfully</h2>
                        </div>
                        <div class="content">
                            <h3>Hello ${name},</h3>
                            <p>Your account password has been successfully changed.</p>
                            
                            <div class="alert-box">
                                <p><strong>📋 Account Details:</strong></p>
                                <p>📧 Email: ${email}</p>
                                ${employeeId ? `<p>🆔 Employee ID: ${employeeId}</p>` : ''}
                                <p>👔 Role: ${role.toUpperCase()}</p>
                                <p>⏰ Changed on: ${new Date().toLocaleString()}</p>
                            </div>
                            
                            <p>If you did not make this change, please contact the administrator immediately.</p>
                            
                            <p>For security reasons:</p>
                            <ul>
                                <li>Never share your password with anyone</li>
                                <li>Use a strong, unique password</li>
                                <li>Enable two-factor authentication if available</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from Intense Beauty Academy.</p>
                            <p>© 2024 Intense Beauty Academy. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Password Changed Successfully

Hello ${name},

Your account password has been successfully changed.

Account Details:
- Email: ${email}
${employeeId ? `- Employee ID: ${employeeId}` : ''}
- Role: ${role.toUpperCase()}
- Changed on: ${new Date().toLocaleString()}

If you did not make this change, please contact the administrator immediately.

For security reasons:
- Never share your password with anyone
- Use a strong, unique password
- Enable two-factor authentication if available

This is an automated message from Intense Beauty Academy.
© 2024 Intense Beauty Academy
            `
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Password change confirmation sent to ${email}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send password change email:`, error.message);
        return { success: false, error: error.message };
    }
};

// Send notification to all admins
async function sendNotificationToAdmins(title, message, type, relatedId = null) {
    try {
        const admins = await Admin.find({ 
            role: { $in: ['super_admin', 'hr_manager', 'admin'] },
            isActive: true 
        });
        
        const notifications = admins.map(admin => ({
            recipientId: admin._id,
            recipientRole: admin.role,
            title,
            message,
            type,
            relatedId,
            isRead: false,
            createdAt: new Date()
        }));
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
        
        console.log(`📧 Notifications sent to ${notifications.length} admins`);
        return { success: true, count: notifications.length };
    } catch (error) {
        console.error('Error sending notifications:', error);
        return { success: false, error: error.message };
    }
}

// Send email notification to admin
async function sendAdminEmailNotification(adminEmail, adminName, studentName, studentEmail, registrationId) {
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Student Registration - Action Required</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .header {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }
                .content {
                    padding: 40px 30px;
                }
                .student-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                }
                .button {
                    display: inline-block;
                    padding: 14px 35px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: bold;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 New Student Registration!</h1>
                    <p>Action Required</p>
                </div>
                <div class="content">
                    <h2>Dear ${adminName},</h2>
                    <p>A new student has registered and is awaiting your approval.</p>
                    <div class="student-details">
                        <p><strong>Student Name:</strong> ${studentName}</p>
                        <p><strong>Email:</strong> ${studentEmail}</p>
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/admin/approvals" class="button">📋 Review Registration</a>
                    </div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🎓 New Student Registration - Action Required (${registrationId})`,
            html: emailHTML
        });
        console.log(`✅ Admin email sent to: ${adminEmail}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Admin email failed:', error);
        return { success: false };
    }
}


// Send email to student about approval/rejection
async function sendStudentApprovalEmail(studentEmail, studentName, registrationId, status, remarks = '') {
    const isApproved = status === 'approved';
    const gradientColor = isApproved ? 'linear-gradient(135deg, #4caf50, #45a049)' : 'linear-gradient(135deg, #f44336, #da190b)';
    const title = isApproved ? '✅ Registration Approved!' : '📋 Registration Update';
    const message = isApproved 
        ? 'Congratulations! Your registration has been approved. You can now access the student portal.'
        : 'We regret to inform you that your registration cannot be approved at this time.';
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Registration ${isApproved ? 'Approved' : 'Update'}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .header {
                    background: ${gradientColor};
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }
                .content {
                    padding: 40px 30px;
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                }
                .remarks-box {
                    background: #fff3cd;
                    padding: 20px;
                    border-radius: 15px;
                    margin: 20px 0;
                    border-left: 5px solid #ffc107;
                }
                .button {
                    display: inline-block;
                    padding: 14px 35px;
                    background: ${gradientColor};
                    color: white;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: bold;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    <h2>Dear ${studentName},</h2>
                    <p>${message}</p>
                    <div class="info-box">
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                        <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                    </div>
                    ${remarks ? `
                    <div class="remarks-box">
                        <strong>📝 Remarks:</strong>
                        <p>${remarks}</p>
                    </div>
                    ` : ''}
                    ${isApproved ? `
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/user/login" class="button">🚀 Login to Student Portal</a>
                    </div>
                    ` : ''}
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: `${isApproved ? '✅ Registration Approved' : '📋 Registration Update'} - ${registrationId}`,
            html: emailHTML
        });
        console.log(`✅ Student ${status} email sent to: ${studentEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Student email failed:`, error);
        return { success: false, error: error.message };
    }
}
// Send email notification for payment update
const sendPaymentUpdateEmail = async (student, oldAmount, newAmount, dueAmount) => {
    try {
        const amountDifference = newAmount - oldAmount;
        const isIncrease = amountDifference > 0;
        
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Update Notification</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                   .header {
    background: linear-gradient(135deg, #4b0082 0%, #8a2be2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
}
                    .header h1 {
                        font-size: 28px;
                        margin-bottom: 10px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .update-box {
                        background: #e3f2fd;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #2196f3;
                    }
                    .amount-change {
                        font-size: 24px;
                        font-weight: bold;
                        color: ${isIncrease ? '#4caf50' : '#f44336'};
                        text-align: center;
                        padding: 15px;
                        background: ${isIncrease ? '#e8f5e9' : '#ffebee'};
                        border-radius: 10px;
                        margin: 15px 0;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #555;
                    }
                    .info-value {
                        color: #333;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 35px;
                        background: linear-gradient(135deg, #2196f3, #1976d2);
                        color: white;
                        text-decoration: none;
                        border-radius: 50px;
                        margin-top: 25px;
                        font-weight: bold;
                        text-align: center;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #e0e0e0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 Payment Update Notification</h1>
                        <p>Your payment record has been updated</p>
                    </div>
                    <div class="content">
                        <h2>Dear ${student.name},</h2>
                        <p>Your payment record has been updated by the administrator. Please review the changes below:</p>
                        
                        <div class="update-box">
                            <h3>📊 Payment Update Details</h3>
                            <div class="info-row">
                                <span class="info-label">Previous Amount:</span>
                                <span class="info-value">₹${oldAmount.toLocaleString()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">New Amount:</span>
                                <span class="info-value">₹${newAmount.toLocaleString()}</span>
                            </div>
                            <div class="amount-change">
                                ${isIncrease ? '↑ Amount Increased by' : '↓ Amount Decreased by'} ₹${Math.abs(amountDifference).toLocaleString()}
                            </div>
                        </div>
                        
                        <div class="details">
                            <h3>📚 Updated Payment Summary</h3>
                            <div class="info-row">
                                <span class="info-label">Registration ID:</span>
                                <span class="info-value">${student.registrationId}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Course Package:</span>
                                <span class="info-value">${student.packageDetails || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Total Package Price:</span>
                                <span class="info-value">${student.packagePrice || '₹0'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Total Paid Amount:</span>
                                <span class="info-value">₹${student.paymentAmount.toLocaleString()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Remaining Due:</span>
                                <span class="info-value" style="color: ${dueAmount > 0 ? '#f59e0b' : '#4caf50'}; font-weight: bold;">
                                    ${dueAmount > 0 ? `₹${dueAmount.toLocaleString()}` : '✅ Fully Paid'}
                                </span>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/user/login" class="button">View Payment History</a>
                        </div>
                        
                        <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 10px;">
                            <p style="margin: 0; color: #856404;">
                                <strong>📝 Note:</strong> If you have any questions about this payment update, please contact the academy administration.
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: `💰 Payment Update Notification - ${student.registrationId}`,
            html: emailHTML
        });
        console.log(`✅ Payment update email sent to: ${student.email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Payment update email failed:', error);
        return { success: false, error: error.message };
    }
};

// Send email notification for new payment
const sendNewPaymentEmail = async (student, amount, dueAmount) => {
    try {
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Payment Received</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .header {
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .payment-details {
                        background: #e8f5e9;
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                        border-left: 5px solid #4caf50;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 35px;
                        background: linear-gradient(135deg, #4caf50, #45a049);
                        color: white;
                        text-decoration: none;
                        border-radius: 50px;
                        margin-top: 25px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 New Payment Received!</h1>
                        <p>Payment has been recorded successfully</p>
                    </div>
                    <div class="content">
                        <h2>Dear ${student.name},</h2>
                        <p>A new payment has been recorded for your account.</p>
                        
                        <div class="payment-details">
                            <h3>📊 Payment Details</h3>
                            <p><strong>Amount Paid:</strong> ₹${amount.toLocaleString()}</p>
                            <p><strong>Remaining Due:</strong> ${dueAmount > 0 ? `₹${dueAmount.toLocaleString()}` : '✅ Fully Paid'}</p>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/user/login" class="button">View Payment History</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: `💰 New Payment Received - ${student.registrationId}`,
            html: emailHTML
        });
        console.log(`✅ New payment email sent to: ${student.email}`);
    } catch (error) {
        console.error('❌ New payment email failed:', error);
    }
};

// ==================== MIDDLEWARE ====================

const verifyStudentToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
        
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// ==================== API ENDPOINTS ====================

// Student Registration
app.post('/api/register', async (req, res) => {
    try {
        const { 
            fullName, fatherName, dob, aadhar, presentAddress, permanentAddress,
            joinDate, package: packageValue, packagePrice, dueAmount,
            contact, altContact, email,
            paymentMethod, paidAmount, transactionId
        } = req.body;

        const name = fullName;
        const aadharNumber = aadhar;
        const contactNumber = contact;
        const altContactNumber = altContact;
        const dateOfBirth = new Date(dob);
        const dateOfJoin = new Date(joinDate);

        const rawPrice = packagePrice ? String(packagePrice).replace(/[^0-9]/g, '') : "0";
        const packagePriceNum = parseInt(rawPrice, 10) || 0;
        const paymentAmountNum = parseFloat(paidAmount) || 0;
        const finalDueAmount = packagePriceNum - paymentAmountNum;

        if (isNaN(dateOfBirth.getTime()) || isNaN(dateOfJoin.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format for DOB or Join Date' });
        }

        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { aadharNumber }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email or Aadhar already exists' });
        }

        const defaultPassword = generateDefaultPassword();
        
        const userData = {
            name,
            fatherName,
            dateOfBirth,
            aadharNumber,
            presentAddress,
            permanentAddress,
            dateOfJoin,
            packageDetails: packageValue,
            packageValue,
            packagePrice: `₹${packagePriceNum.toLocaleString()}`,
            dueAmount: finalDueAmount,
            contactNumber,
            altContactNumber,
            email: email.toLowerCase(),
            password: defaultPassword,
            paymentMethod: paymentMethod ? (paymentMethod === 'UPI' ? 'UPI' : 'Cash') : null,
            paymentAmount: paymentAmountNum,
            paymentStatus: paymentAmountNum >= packagePriceNum ? 'completed' : 'pending',
            paymentDate: paymentAmountNum > 0 ? new Date() : null,
            transactionId: (paymentMethod === 'UPI' && transactionId) ? transactionId : null
        };

        const user = new User(userData);
        await user.save();

        // ✅ CREATE PAYMENT RECORD IN PAYMENT COLLECTION
   if (paymentAmountNum > 0) {
    const paymentRecord = new Payment({
        studentId: user._id,
        studentName: user.name,
        registrationId: user.registrationId,
        amount: paymentAmountNum,
        dueAmount: finalDueAmount,  // ✅ Store due amount in payment record
        paymentDate: new Date(),
        status: paymentAmountNum >= packagePriceNum ? 'completed' : 'partial',
        paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'Cash',
        transactionId: (paymentMethod === 'UPI' && transactionId) ? transactionId : `REG-${user.registrationId}`,
        remarks: `Initial registration payment for ${user.packageDetails}`,
        coursePackage: user.packageDetails,
        packagePrice: packagePriceNum
    });
    await paymentRecord.save();
    console.log(`✅ Payment record created for ${user.name} - Amount: ₹${paymentAmountNum}, Due: ₹${finalDueAmount}`);
}
        // Create initial progress record
        const initialProgress = new StudentProgress({
            studentId: user._id, 
            registrationId: user.registrationId,
            courseProgress: { 
                totalModules: 12, 
                currentModule: "Introduction to Beauty & Cosmetology", 
                completedModules: 0 
            },
            recentActivities: [{ 
                activity: `Registered with ₹${paymentAmountNum} payment. Balance due: ₹${finalDueAmount}`, 
                type: 'achievement' 
            }]
        });
        await initialProgress.save();

        // Send welcome email to student
        await sendStudentWelcomeEmail({
            name: user.name,
            email: user.email,
            registrationId: user.registrationId,
            packageDetails: user.packageDetails,
            packagePrice: user.packagePrice,
            paymentAmount: user.paymentAmount,
            dueAmount: user.dueAmount,
            dateOfJoin: user.dateOfJoin
        }, defaultPassword);

        // Send notifications to admins
        const admins = await Admin.find({ role: { $in: ['super_admin', 'hr_manager', 'admin'] }, isActive: true });
        for (const admin of admins) {
            await sendAdminEmailNotification(admin.email, admin.name, user.name, user.email, user.registrationId);
        }
        
        await sendNotificationToAdmins(
            'New Student Registration', 
            `${user.name} (${user.registrationId}) has registered. Payment: ₹${paymentAmountNum}, Due: ₹${finalDueAmount}`, 
            'registration', 
            user._id
        );

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful! Login credentials sent to your email.', 
            registrationId: user.registrationId,
            paymentRecord: paymentAmountNum > 0 ? true : false
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error during registration', 
            error: error.message 
        });
    }
});
/**
 * @route   POST /api/admin/first-time-password
 * @desc    Change password on first login for admin/employee
 * @access  Private (requires token from login)
 */
app.post('/admin/first-time-password', verifyAdminToken, async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        
        // Validate passwords
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Both new password and confirm password are required'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }
        
        // Password strength validation
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Check for password strength (optional)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }
        
        // Get admin from token (attached by verifyAdminToken middleware)
        const admin = req.admin;
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin record not found'
            });
        }
        
        // Check if password already changed
        if (admin.isPasswordChanged) {
            return res.status(400).json({
                success: false,
                message: 'Password already changed. Please use the forgot password feature if you need to reset.'
            });
        }
        
        // Check if trying to use same as old password
        const isSamePassword = await admin.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as old password'
            });
        }
        
        // Update password
        admin.password = newPassword; // Will be hashed by pre-save middleware
        admin.isPasswordChanged = true;
        admin.lastPasswordChange = new Date();
        admin.loginAttempts = 0; // Reset login attempts
        admin.lockUntil = undefined; // Remove lock if any
        
        await admin.save();
        
        // Send password change confirmation email
        const emailResult = await sendAdminPasswordChangeConfirmation({
            name: admin.name,
            email: admin.email,
            employeeId: admin.employeeId,
            role: admin.role
        });
        
        // Send notification to super admins about password change
        await sendNotificationToSuperAdmins(
            'Admin Password Change',
            `${admin.name} (${admin.email}) has changed their password on first login.`,
            'password_change',
            admin._id
        );
        
        // Generate new token with updated info
        const jwt = require('jsonwebtoken');
        const newToken = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: admin.role,
                isPasswordChanged: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(200).json({
            success: true,
            message: emailResult.success 
                ? 'Password changed successfully! A confirmation email has been sent.'
                : 'Password changed successfully! (Confirmation email could not be sent)',
            token: newToken,
            data: {
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isPasswordChanged: true,
                employeeId: admin.employeeId
            }
        });
        
    } catch (error) {
        console.error('First-time password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

app.post('/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }
        
        const admin = await Admin.findOne({ email, isActive: true });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address'
            });
        }
        
        // Generate reset token
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 3600000; // 1 hour
        
        admin.passwordResetToken = resetToken;
        admin.passwordResetExpires = resetExpires;
        await admin.save();
        
        // Send reset email (implement this)
        // await sendPasswordResetEmail(admin.email, resetToken);
        
        res.status(200).json({
            success: true,
            message: 'Password reset instructions sent to your email',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
});
// Student Login
app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user._id, email: user.email, role: 'student', registrationId: user.registrationId }, JWT_SECRET, { expiresIn: '7d' });
        const userData = user.toObject();
        delete userData.password;
        
        res.status(200).json({ 
            success: true, 
            message: 'Login successful', 
            data: { 
                user: userData, 
                token, 
                requiresPasswordChange: !user.isPasswordChanged 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
});

// Student - First Time Password Change
app.post('/api/student/first-time-password', verifyStudentToken, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password is required and must be at least 6 characters long' 
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student record not found' 
            });
        }

        // Update password
        user.password = newPassword;
        user.isPasswordChanged = true;
        user.lastPasswordChange = new Date();
        
        await user.save();

        // Send password change confirmation email
        await sendPasswordChangeConfirmation({
            name: user.name,
            email: user.email,
            registrationId: user.registrationId
        });

        // Send notification to admins about password change
        await sendNotificationToAdmins(
            'Password Change', 
            `${user.name} (${user.registrationId}) has changed their password.`, 
            'password_change', 
            user._id
        );

        res.status(200).json({ 
            success: true, 
            message: 'Your password has been changed successfully! A confirmation email has been sent.' 
        });
    } catch (error) {
        console.error('First-time password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating password', 
            error: error.message 
        });
    }
});

// Student - Change Password (for existing users)
app.put('/api/student/change-password', verifyStudentToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        const user = await User.findById(req.user._id).select('+password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student record not found' 
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update to new password
        user.password = newPassword;
        user.lastPasswordChange = new Date();
        
        await user.save();

        // Send password change confirmation email
        await sendPasswordChangeConfirmation({
            name: user.name,
            email: user.email,
            registrationId: user.registrationId
        });

        // Send notification to admins
        await sendNotificationToAdmins(
            'Password Change', 
            `${user.name} (${user.registrationId}) has changed their password.`, 
            'password_change', 
            user._id
        );

        res.status(200).json({ 
            success: true, 
            message: 'Password changed successfully! A confirmation email has been sent.' 
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error changing password', 
            error: error.message 
        });
    }
});

// Admin Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
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
        res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
});

// Student Profile
app.get('/api/student/profile', verifyStudentToken, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
});

// Dashboard Stats
app.get('/api/student/dashboard-stats', verifyStudentToken, async (req, res) => {
    try {
        let progress = await StudentProgress.findOne({ studentId: req.user._id });
        if (!progress) {
            progress = new StudentProgress({ studentId: req.user._id, registrationId: req.user.registrationId });
            await progress.save();
        }
        
        const stats = {
            courseProgress: progress.courseProgress,
            achievementPoints: progress.achievementPoints,
            certificateStatus: progress.certificateStatus,
            recentActivities: progress.recentActivities.slice(0, 5)
        };
        
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
});

// Admin - Get All Students
app.get('/api/admin/all-students', verifyAdminToken, async (req, res) => {
    try {
        const students = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
});

// Admin - Get Pending Students
app.get('/api/admin/pending-students', verifyAdminToken, async (req, res) => {
    try {
        const students = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
});

// Admin - Get Approved Students
app.get('/api/admin/approved-students', verifyAdminToken, async (req, res) => {
    try {
        const students = await User.find({ status: 'active' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('Error fetching approved students:', error);
        res.status(500).json({ success: false, message: 'Error fetching approved students', error: error.message });
    }
});

// Admin - Get Rejected Students
app.get('/api/admin/rejected-students', verifyAdminToken, async (req, res) => {
    try {
        const students = await User.find({ status: 'rejected' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('Error fetching rejected students:', error);
        res.status(500).json({ success: false, message: 'Error fetching rejected students', error: error.message });
    }
});

// Admin - Get Student Stats
app.get('/api/admin/student-stats', verifyAdminToken, async (req, res) => {
    try {
        const stats = {
            total: await User.countDocuments(),
            pending: await User.countDocuments({ status: 'pending' }),
            approved: await User.countDocuments({ status: 'active' }),
            rejected: await User.countDocuments({ status: 'rejected' })
        };
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
});

// Admin - Approve Single Student
app.put('/api/admin/approve-student/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        
        student.status = 'active';
        await student.save();
        
        await sendStudentApprovalEmail(student.email, student.name, student.registrationId, 'approved');
        
        res.status(200).json({ success: true, message: 'Student approved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error approving student', error: error.message });
    }
});

// Admin - Bulk Approve Students
app.post('/api/admin/bulk-approve-students', verifyAdminToken, async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!studentIds || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No students selected' });
        }
        
        const students = await User.find({ _id: { $in: studentIds }, status: 'pending' });
        for (const student of students) {
            student.status = 'active';
            await student.save();
            await sendStudentApprovalEmail(student.email, student.name, student.registrationId, 'approved');
        }
        
        res.status(200).json({ success: true, message: `${students.length} students approved successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error bulk approving students', error: error.message });
    }
});

// Admin - Reject Single Student
app.put('/api/admin/reject-student/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const { remarks } = req.body;
        if (!remarks) return res.status(400).json({ success: false, message: 'Remarks are required' });
        
        const student = await User.findById(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        
        student.status = 'rejected';
        await student.save();
        
        await sendStudentApprovalEmail(student.email, student.name, student.registrationId, 'rejected', remarks);
        
        res.status(200).json({ success: true, message: 'Student rejected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error rejecting student', error: error.message });
    }
});

// Admin - Bulk Reject Students
app.post('/api/admin/bulk-reject-students', verifyAdminToken, async (req, res) => {
    try {
        const { studentIds, remarks } = req.body;
        if (!studentIds || studentIds.length === 0) return res.status(400).json({ success: false, message: 'No students selected' });
        if (!remarks) return res.status(400).json({ success: false, message: 'Remarks are required' });
        
        const students = await User.find({ _id: { $in: studentIds }, status: 'pending' });
        for (const student of students) {
            student.status = 'rejected';
            await student.save();
            await sendStudentApprovalEmail(student.email, student.name, student.registrationId, 'rejected', remarks);
        }
        
        res.status(200).json({ success: true, message: `${students.length} students rejected successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error bulk rejecting students', error: error.message });
    }
});

// Admin - Update Student
app.put('/api/admin/students/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const { name, email, contactNumber, presentAddress, packageDetails, packagePrice, status } = req.body;
        
        const student = await User.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        if (email && email !== student.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.studentId } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
        }
        
        if (name) student.name = name;
        if (email) student.email = email;
        if (contactNumber) student.contactNumber = contactNumber;
        if (presentAddress) student.presentAddress = presentAddress;
        if (packageDetails) student.packageDetails = packageDetails;
        if (packagePrice) student.packagePrice = packagePrice;
        if (status) student.status = status;
        
        await student.save();
        
        const updatedStudent = student.toObject();
        delete updatedStudent.password;
        
        res.status(200).json({ success: true, message: 'Student updated successfully', data: updatedStudent });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
    }
});

// Admin - Delete Student
app.delete('/api/admin/students/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        await StudentProgress.deleteOne({ studentId: req.params.studentId });
        await Assignment.deleteMany({ studentId: req.params.studentId });
        await ModuleCompletion.deleteMany({ studentId: req.params.studentId });
        await ApprovalHistory.deleteMany({ studentId: req.params.studentId });
        
        await User.findByIdAndDelete(req.params.studentId);
        
        res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
    }
});

// Admin - Get Notifications
app.get('/api/admin/notifications', verifyAdminToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.admin._id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ recipientId: req.admin._id, isRead: false });
        res.status(200).json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
    }
});

// Admin - Mark Notification as Read
app.put('/api/admin/notifications/:notificationId/read', verifyAdminToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
    }
});

// Admin - Get All Admins
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
    }
});

// Admin - Create Admin
// app.post('/api/admins', async (req, res) => {
//     try {
//         const { name, email, role } = req.body;
//         const defaultPassword = generateDefaultPassword();
        
//         const admin = new Admin({ name, email, password: defaultPassword, role: role || 'admin', isActive: true, isPasswordChanged: false });
//         await admin.save();
        
//         res.status(201).json({ success: true, message: 'Admin created successfully', data: { name, email, role: admin.role, defaultPassword } });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
//     }
// });
app.post('/api/admins', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        
        // Input validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required fields'
            });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }
        
        // Generate default password
        const defaultPassword = generateDefaultPassword(); // Your password generation function
        
        // Create new admin
        const admin = new Admin({
            name,
            email,
            password: defaultPassword,
            role: role || 'admin',
            isActive: true,
            isPasswordChanged: false,
            createdAt: new Date()
        });
        
        // Save to database
        await admin.save();
        console.log(`✅ Admin created: ${email}`);
        
        // ============================================
        // CALL EMAIL FUNCTION HERE
        // ============================================
        const emailResult = await sendAdminCredentialsEmail(
            name, 
            email, 
            defaultPassword, 
            admin.role
        );
        
        // Prepare response
        const responseData = {
            success: true,
            message: emailResult.success 
                ? 'Admin created successfully and credentials sent via email'
                : 'Admin created successfully but email delivery failed',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                defaultPassword: defaultPassword, // Only for development
                emailSent: emailResult.success,
                createdAt: admin.createdAt
            }
        };
        
        // Add email error details if any
        if (!emailResult.success) {
            responseData.warning = `Admin created but email not sent: ${emailResult.error}`;
        }
        
        res.status(201).json(responseData);
        
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});
// Admin - Update Admin
app.put('/api/admins/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        const { id } = req.params;
        const { name, email, role, phone, department, salary, status } = req.body;

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email, _id: { $ne: id } });
            if (existingAdmin) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
        }

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (phone) admin.phone = phone;
        if (department) admin.department = department;
        if (salary) admin.salary = salary;
        if (status !== undefined) admin.isActive = status === 'Active';

        await admin.save();

        const updatedAdmin = admin.toObject();
        delete updatedAdmin.password;

        res.status(200).json({ success: true, message: 'Employee updated successfully', data: updatedAdmin });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: 'Error updating employee', error: error.message });
    }
});

// Admin - Delete Admin
// Delete payment - FIXED to recalculate due amount
app.delete('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        const student = await User.findById(payment.studentId);
        if (student) {
            // Get all remaining payments excluding this one
            const remainingPayments = await Payment.find({ 
                studentId: payment.studentId,
                _id: { $ne: req.params.paymentId }
            });
            
            const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
            const packagePriceNum = parseInt(String(student.packagePrice).replace(/[^0-9]/g, '')) || 0;
            const newDueAmount = packagePriceNum - totalPaid;
            
            // Update student's payment totals
            student.paymentAmount = totalPaid;
            student.dueAmount = newDueAmount > 0 ? newDueAmount : packagePriceNum;
            student.paymentStatus = totalPaid >= packagePriceNum ? 'completed' : 'pending';
            
            // If no payments left, clear transaction details
            if (remainingPayments.length === 0) {
                student.transactionId = null;
                student.paymentMethod = null;
                student.paymentDate = null;
            } else {
                // Get the latest payment
                const latestPayment = remainingPayments.sort((a, b) => b.paymentDate - a.paymentDate)[0];
                student.transactionId = latestPayment.transactionId;
                student.paymentMethod = latestPayment.paymentMethod;
                student.paymentDate = latestPayment.paymentDate;
            }
            
            await student.save();
            
            // Update remaining payments' due amounts
            let runningTotal = 0;
            const sortedPayments = remainingPayments.sort((a, b) => a.paymentDate - b.paymentDate);
            
            for (const p of sortedPayments) {
                runningTotal += p.amount;
                const dueAfterThis = packagePriceNum - runningTotal;
                p.dueAmount = dueAfterThis > 0 ? dueAfterThis : 0;
                p.status = dueAfterThis <= 0 ? 'completed' : 'partial';
                await p.save();
            }
        }
        
        await Payment.findByIdAndDelete(req.params.paymentId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ success: false, message: 'Error deleting payment', error: error.message });
    }
});

// ==================== PAYMENT ENDPOINTS ====================

// Create new payment - FIXED to calculate due amount correctly
// Create new payment - FIXED with correct due amount calculation
app.post('/api/admin/payments', verifyAdminToken, async (req, res) => {
    try {
        const { studentId, studentName, amount, paymentDate, status, paymentMethod, transactionId, remarks } = req.body;
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        // Get package price as number
        const packagePriceNum = parseInt(String(student.packagePrice).replace(/[^0-9]/g, '')) || 0;
        
        // Get ALL existing payments for this student
        const existingPayments = await Payment.find({ studentId }).sort({ paymentDate: 1, createdAt: 1 });
        const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Calculate new totals
        const newAmount = parseFloat(amount) || 0;
        const newTotalPaid = totalPaidSoFar + newAmount;
        const newDueAmount = packagePriceNum - newTotalPaid;
        
        // Generate transaction ID if not provided
        let finalTransactionId = transactionId;
        if (!finalTransactionId) {
            const prefix = 'TXN';
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const count = await Payment.countDocuments();
            finalTransactionId = `${prefix}${year}${month}${String(count + 1).padStart(6, '0')}`;
        }
        
        // Determine payment status
        let paymentStatus = 'pending';
        if (newDueAmount <= 0) {
            paymentStatus = 'completed';
        } else if (newAmount > 0 && newDueAmount > 0) {
            paymentStatus = 'partial';
        }
        
        // Create new payment record
        const payment = new Payment({
            studentId,
            studentName,
            registrationId: student.registrationId,
            amount: newAmount,
            dueAmount: newDueAmount > 0 ? newDueAmount : 0,
            paymentDate: paymentDate || new Date(),
            status: paymentStatus,
            paymentMethod,
            transactionId: finalTransactionId,
            remarks: remarks || `Payment for ${student.packageDetails}`,
            coursePackage: student.packageDetails,
            packagePrice: packagePriceNum
        });
        
        await payment.save();
        
        // UPDATE ALL EXISTING PAYMENTS' DUE AMOUNTS
        const allPayments = [...existingPayments, payment];
        allPayments.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
        
        let runningTotal = 0;
        for (const p of allPayments) {
            runningTotal += p.amount;
            const dueAfterThis = packagePriceNum - runningTotal;
            p.dueAmount = dueAfterThis > 0 ? dueAfterThis : 0;
            p.status = dueAfterThis <= 0 ? 'completed' : (p.amount > 0 ? 'partial' : 'pending');
            await p.save();
        }
        
        // Update student record
        student.paymentAmount = newTotalPaid;
        student.dueAmount = newDueAmount > 0 ? newDueAmount : 0;
        student.paymentStatus = newDueAmount <= 0 ? 'completed' : 'pending';
        student.paymentDate = paymentDate || new Date();
        student.paymentMethod = paymentMethod;
        student.transactionId = finalTransactionId;
        await student.save();
        
        // Send email notification for new payment
        await sendNewPaymentEmail(student, newAmount, newDueAmount);
        
        res.status(201).json({ 
            success: true, 
            message: 'Payment created successfully', 
            data: payment,
            updatedStudent: {
                paymentAmount: student.paymentAmount,
                dueAmount: student.dueAmount,
                paymentStatus: student.paymentStatus
            }
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Transaction ID already exists' });
        }
        res.status(500).json({ success: false, message: 'Error creating payment', error: error.message });
    }
});
// Get all payments - Updated to include dueAmount
app.get('/api/admin/payments', verifyAdminToken, async (req, res) => {
    try {
        const { status, startDate, endDate, search } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }
        
        // Get all payments from Payment collection
        let payments = await Payment.find(query)
            .sort({ paymentDate: -1, createdAt: -1 })
            .lean();
        
        // If search term provided, filter by student name or transaction ID
        if (search) {
            payments = payments.filter(payment => 
                payment.studentName?.toLowerCase().includes(search.toLowerCase()) ||
                payment.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
                payment.registrationId?.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // Enhance payment data with additional student info from User collection
        const enhancedPayments = await Promise.all(payments.map(async (payment) => {
            const student = await User.findById(payment.studentId).select('name email contactNumber packagePrice dueAmount packageDetails paymentAmount');
            return {
                ...payment,
                studentDetails: student || null,
                courseFee: student?.packagePrice || 'N/A',
                totalPaid: student?.paymentAmount || 0,
                remainingDue: student?.dueAmount || payment.dueAmount || 0,
                contactNumber: student?.contactNumber || 'N/A',
                packageDetails: student?.packageDetails || payment.coursePackage || 'N/A',
                // Format amounts for display
                formattedAmount: `₹${payment.amount.toLocaleString()}`,
                formattedDueAmount: `₹${(payment.dueAmount || 0).toLocaleString()}`
            };
        }));
        
        res.status(200).json({ 
            success: true, 
            data: enhancedPayments,
            total: enhancedPayments.length
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
});
// Get payment statistics - Updated with due amount analysis
app.get('/api/admin/payments/status', verifyAdminToken, async (req, res) => {
    try {
        const payments = await Payment.find();
        const students = await User.find();
        
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const completedAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);
        const partialAmount = payments
            .filter(p => p.status === 'partial')
            .reduce((sum, p) => sum + p.amount, 0);
        const successRate = totalRevenue > 0 ? Math.round((completedAmount / totalRevenue) * 100) : 0;
        
        // Calculate total due amount from all students
        const totalDueAmount = students.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
        
        // Get students with pending dues
        const studentsWithDues = students.filter(s => (s.dueAmount || 0) > 0);
        const totalDueStudents = studentsWithDues.length;
        const averageDueAmount = totalDueStudents > 0 ? totalDueAmount / totalDueStudents : 0;
        
        res.status(200).json({ 
            success: true, 
            data: {
                totalRevenue,
                completedAmount,
                pendingAmount,
                partialAmount,
                successRate,
                totalDueAmount,
                totalDueStudents,
                averageDueAmount,
                totalPayments: payments.length,
                completedCount: payments.filter(p => p.status === 'completed').length,
                pendingCount: payments.filter(p => p.status === 'pending').length,
                partialCount: payments.filter(p => p.status === 'partial').length,
                failedCount: payments.filter(p => p.status === 'failed').length
            }
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
});

// Update payment
// Update payment - FIXED to recalculate due amount
// Update payment - COMPLETELY FIXED with recalculated due amount and email
// Update payment - COMPLETELY FIXED with correct due amount calculation
app.put('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const { amount, paymentDate, status, paymentMethod, transactionId, remarks } = req.body;
        
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        const student = await User.findById(payment.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        // Store old amount for comparison
        const oldAmount = payment.amount;
        
        // Get package price as number
        const packagePriceNum = parseInt(String(student.packagePrice).replace(/[^0-9]/g, '')) || 0;
        
        // Get ALL payments for this student (excluding the current one)
        const allOtherPayments = await Payment.find({ 
            studentId: payment.studentId,
            _id: { $ne: req.params.paymentId }
        }).sort({ paymentDate: 1, createdAt: 1 });
        
        // Calculate total paid from other payments
        const totalPaidFromOthers = allOtherPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Calculate new total paid including updated payment
        const newAmount = amount !== undefined ? amount : payment.amount;
        const newTotalPaid = totalPaidFromOthers + newAmount;
        
        // Calculate new due amount
        const newDueAmount = packagePriceNum - newTotalPaid;
        
        // Update current payment
        if (amount !== undefined) payment.amount = amount;
        if (paymentDate) payment.paymentDate = paymentDate;
        if (paymentMethod) payment.paymentMethod = paymentMethod;
        if (transactionId) payment.transactionId = transactionId;
        if (remarks !== undefined) payment.remarks = remarks;
        payment.updatedAt = new Date();
        
        // Set the due amount for THIS payment (remaining after this payment)
        payment.dueAmount = newDueAmount > 0 ? newDueAmount : 0;
        
        // Set status for THIS payment
        if (newDueAmount <= 0) {
            payment.status = 'completed';
        } else if (newAmount > 0 && newDueAmount > 0) {
            payment.status = 'partial';
        } else {
            payment.status = 'pending';
        }
        
        await payment.save();
        
        // UPDATE ALL OTHER PAYMENTS' DUE AMOUNTS (in chronological order)
        // Combine all payments including the updated one
        const allPayments = [...allOtherPayments, payment];
        allPayments.sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
        
        let runningTotal = 0;
        for (const p of allPayments) {
            runningTotal += p.amount;
            const dueAfterThis = packagePriceNum - runningTotal;
            p.dueAmount = dueAfterThis > 0 ? dueAfterThis : 0;
            p.status = dueAfterThis <= 0 ? 'completed' : (p.amount > 0 ? 'partial' : 'pending');
            await p.save();
        }
        
        // Update student record
        student.paymentAmount = newTotalPaid;
        student.dueAmount = newDueAmount > 0 ? newDueAmount : 0;
        student.paymentStatus = newDueAmount <= 0 ? 'completed' : 'pending';
        student.paymentDate = paymentDate || payment.paymentDate;
        student.paymentMethod = paymentMethod || payment.paymentMethod;
        student.transactionId = transactionId || payment.transactionId;
        await student.save();
        
        // Send email notification if amount changed
        if (oldAmount !== newAmount) {
            await sendPaymentUpdateEmail(student, oldAmount, newAmount, newDueAmount);
        }
        
        // Return updated payment
        const enhancedPayment = {
            ...payment.toObject(),
            studentDetails: {
                _id: student._id,
                name: student.name,
                packagePrice: student.packagePrice,
                dueAmount: student.dueAmount,
                paymentAmount: student.paymentAmount,
                email: student.email
            },
            totalPaid: newTotalPaid,
            remainingDue: newDueAmount,
            allPayments: allPayments.map(p => ({
                amount: p.amount,
                dueAmount: p.dueAmount,
                paymentDate: p.paymentDate
            }))
        };
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment updated successfully', 
            data: enhancedPayment 
        });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, message: 'Error updating payment', error: error.message });
    }
});
// Get single payment by ID

app.get('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId).lean();
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        // Get complete student details
        const student = await User.findById(payment.studentId).select('-password');
        
        const enhancedPayment = {
            ...payment,
            studentDetails: student,
            courseFee: student?.packagePrice || 'N/A',
            dueAmount: student?.dueAmount || 0,
            contactNumber: student?.contactNumber || 'N/A',
            email: student?.email || 'N/A'
        };
        
        res.status(200).json({ success: true, data: enhancedPayment });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, message: 'Error fetching payment', error: error.message });
    }
});
app.get('/api/admin/student-payments/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const payments = await Payment.find({ studentId: req.params.studentId })
            .sort({ paymentDate: -1 });
        
        const student = await User.findById(req.params.studentId).select('name registrationId packagePrice dueAmount paymentAmount');
        
        res.status(200).json({ 
            success: true, 
            data: {
                studentDetails: student,
                payments: payments,
                totalPaid: student?.paymentAmount || 0,
                dueAmount: student?.dueAmount || 0
            }
        });
    } catch (error) {
        console.error('Error fetching student payments:', error);
        res.status(500).json({ success: false, message: 'Error fetching student payments', error: error.message });
    }
});
// Delete payment
app.put('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const { amount, paymentDate, status, paymentMethod, transactionId, remarks } = req.body;
        
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        const oldAmount = payment.amount;
        
        // Update payment fields
        if (amount) payment.amount = amount;
        if (paymentDate) payment.paymentDate = paymentDate;
        if (status) payment.status = status;
        if (paymentMethod) payment.paymentMethod = paymentMethod;
        if (transactionId) payment.transactionId = transactionId;
        if (remarks !== undefined) payment.remarks = remarks;
        payment.updatedAt = new Date();
        
        await payment.save();
        
        // Update student's payment totals if amount changed
        if (amount && amount !== oldAmount) {
            const student = await User.findById(payment.studentId);
            if (student) {
                const paymentDifference = amount - oldAmount;
                const newPaidAmount = (student.paymentAmount || 0) + paymentDifference;
                const packagePriceNum = parseInt(String(student.packagePrice).replace(/[^0-9]/g, '')) || 0;
                const newDueAmount = packagePriceNum - newPaidAmount;
                
                student.paymentAmount = newPaidAmount;
                student.dueAmount = newDueAmount > 0 ? newDueAmount : 0;
                student.paymentStatus = newPaidAmount >= packagePriceNum ? 'completed' : 'pending';
                await student.save();
            }
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Payment updated successfully', 
            data: payment 
        });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, message: 'Error updating payment', error: error.message });
    }
});


// Get payment statistics
app.get('/api/admin/payments/status', verifyAdminToken, async (req, res) => {
    try {
        const payments = await Payment.find();
        const students = await User.find();
        
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const completedAmount = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);
        const successRate = totalRevenue > 0 ? Math.round((completedAmount / totalRevenue) * 100) : 0;
        
        // Calculate total due amount from all students
        const totalDueAmount = students.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
        
        res.status(200).json({ 
            success: true, 
            data: {
                totalRevenue,
                completedAmount,
                pendingAmount,
                successRate,
                totalDueAmount,
                totalPayments: payments.length,
                completedCount: payments.filter(p => p.status === 'completed').length,
                pendingCount: payments.filter(p => p.status === 'pending').length,
                failedCount: payments.filter(p => p.status === 'failed').length
            }
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
});

// Get all student payments (for a specific student)
app.get('/api/admin/student-payments/:studentId', verifyAdminToken, async (req, res) => {
    try {
        const payments = await Payment.find({ studentId: req.params.studentId })
            .sort({ paymentDate: -1 });
        
        const student = await User.findById(req.params.studentId).select('name registrationId packagePrice dueAmount paymentAmount');
        
        res.status(200).json({ 
            success: true, 
            data: {
                studentDetails: student,
                payments: payments,
                totalPaid: student?.paymentAmount || 0,
                dueAmount: student?.dueAmount || 0
            }
        });
    } catch (error) {
        console.error('Error fetching student payments:', error);
        res.status(500).json({ success: false, message: 'Error fetching student payments', error: error.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   POST   /api/register - Student Registration (with email)`);
    console.log(`   POST   /api/user/login - Student Login`);
    console.log(`   POST   /api/student/first-time-password - First Time Password Change (with email)`);
    console.log(`   PUT    /api/student/change-password - Change Password (with email)`);
    console.log(`   POST   /api/login - Admin Login`);
    console.log(`   GET    /api/student/profile - Student Profile`);
    console.log(`   GET    /api/student/dashboard-stats - Dashboard Stats`);
    console.log(`   GET    /api/admin/all-students - All Students (Admin)`);
    console.log(`   GET    /api/admin/pending-students - Pending Students (Admin)`);
    console.log(`   GET    /api/admin/approved-students - Approved Students (Admin)`);
    console.log(`   GET    /api/admin/rejected-students - Rejected Students (Admin)`);
    console.log(`   PUT    /api/admin/approve-student/:id - Approve Student (Admin)`);
    console.log(`   POST   /api/admin/bulk-approve-students - Bulk Approve (Admin)`);
    console.log(`   GET    /api/admin/payments - Payments (Admin)`);
    console.log(`   POST   /api/admin/payments - Create Payment (Admin)`);
    console.log(`   GET    /api/admin/notifications - Notifications (Admin)\n`);
});