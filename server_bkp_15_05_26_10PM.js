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
const paymentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    registrationId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash', 'UPI'], required: true },
    transactionId: { type: String, unique: true, sparse: true },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

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

// Send welcome email to student with registration details
const sendStudentWelcomeEmail = async (userData, defaultPassword) => {
    const { name, email, registrationId, packageDetails, packagePrice, paymentAmount, dueAmount, dateOfJoin } = userData;
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to Intense Beauty Academy</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .warning { color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 15px; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Intense Beauty Academy! 🎓</h1>
                </div>
                <div class="content">
                    <h2>Dear ${name},</h2>
                    <p>Thank you for registering at Intense Beauty Academy. We're excited to have you on board!</p>
                    
                    <div class="credentials">
                        <h3>📋 Your Login Credentials</h3>
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 5px; border-radius: 3px;">${defaultPassword}</code></p>
                        <p class="warning"><strong>⚠️ Important:</strong> Please change your password after first login for security reasons.</p>
                    </div>
                    
                    <div class="details">
                        <h3>📚 Course Details</h3>
                        <p><strong>Package:</strong> ${packageDetails}</p>
                        <p><strong>Date of Joining:</strong> ${new Date(dateOfJoin).toLocaleDateString()}</p>
                        <p><strong>Total Package Price:</strong> ${packagePrice}</p>
                        <p><strong>Amount Paid:</strong> ₹${paymentAmount.toLocaleString()}</p>
                        ${dueAmount > 0 ? `<p><strong>Due Amount:</strong> ₹${dueAmount.toLocaleString()}</p>` : ''}
                        ${dueAmount === 0 ? `<p><strong>Payment Status:</strong> ✅ Fully Paid</p>` : '<p><strong>Payment Status:</strong> ⏳ Partially Paid</p>'}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/user/login" class="button">Login to Student Portal</a>
                    </div>
                    
                    <div class="warning">
                        <p><strong>📝 Next Steps:</strong></p>
                        <ol>
                            <li>Login using your Registration ID/Email and temporary password</li>
                            <li>Change your password immediately after first login</li>
                            <li>Complete your profile and start your course</li>
                            <li>For any assistance, contact our support team</li>
                        </ol>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Welcome to Intense Beauty Academy - Login Credentials (ID: ${registrationId})`,
            html: emailHTML
        });
        console.log('✅ Welcome email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Welcome email failed:', error);
        return { success: false };
    }
};

// Send email for password change confirmation
const sendPasswordChangeConfirmation = async (userData) => {
    const { name, email, registrationId } = userData;
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Password Changed Successfully</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4caf50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #4caf50, #45a049); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed Successfully! 🔐</h1>
                </div>
                <div class="content">
                    <h2>Dear ${name},</h2>
                    <p>This email confirms that your account password has been successfully changed.</p>
                    
                    <div class="warning">
                        <h3>📋 Account Information</h3>
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password Changed On:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p>If you made this change, no further action is required.</p>
                    
                    <div class="warning">
                        <p><strong>⚠️ Security Alert:</strong> If you did NOT change your password, please contact our support team immediately at support@intensebeautyacademy.com</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/user/login" class="button">Login to Your Account</a>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Password Changed Successfully - ${registrationId}`,
            html: emailHTML
        });
        console.log('✅ Password change confirmation email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Password change email failed:', error);
        return { success: false };
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
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>New Student Registration! 🎓</h1></div>
                <div class="content">
                    <h2>Dear ${adminName},</h2>
                    <p>A new student has registered and is awaiting your approval.</p>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <p><strong>Name:</strong> ${studentName}</p>
                        <p><strong>Email:</strong> ${studentEmail}</p>
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/admin/approvals" class="button">Review Registration</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `New Student Registration - Action Required (${registrationId})`,
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
    const headerColor = isApproved ? 'linear-gradient(135deg, #4caf50, #45a049)' : 'linear-gradient(135deg, #f44336, #da190b)';
    const title = isApproved ? 'Registration Approved! ✅' : 'Registration Update 📋';
    const message = isApproved 
        ? 'Congratulations! Your registration has been approved. You can now access the student portal.'
        : 'We regret to inform you that your registration cannot be approved at this time.';
    
    const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Registration ${isApproved ? 'Approved' : 'Update'}</title></head>
        <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: ${headerColor}; color: white; padding: 30px; text-align: center;">
                    <h1>${title}</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <h2>Dear ${studentName},</h2>
                    <p>${message}</p>
                    <div style="background: white; padding: 15px;">
                        <p><strong>Registration ID:</strong> ${registrationId}</p>
                        <p><strong>Status:</strong> ${status.toUpperCase()}</p>
                    </div>
                    ${remarks ? `<div style="background: #fff3cd; padding: 15px;"><strong>Remarks:</strong> ${remarks}</div>` : ''}
                    ${isApproved ? `<div style="text-align: center;"><a href="http://localhost:5173/user/login" style="display: inline-block; padding: 12px 30px; background: ${headerColor}; color: white; text-decoration: none;">Login to Student Portal</a></div>` : ''}
                </div>
            </div>
        </body>
        </html>
    `;
    
    try {
        await transporter.sendMail({
            from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: `Registration ${isApproved ? 'Approved' : 'Update'} - ${registrationId}`,
            html: emailHTML
        });
        console.log(`✅ Student ${status} email sent to: ${studentEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Student email failed:`, error);
        return { success: false };
    }
}

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
            paymentMethod: paymentMethod ? paymentMethod.toUpperCase() : null,
            paymentAmount: paymentAmountNum,
            paymentStatus: paymentAmountNum >= packagePriceNum ? 'completed' : 'pending',
            paymentDate: paymentAmountNum > 0 ? new Date() : null
        };

        if (paymentMethod?.toLowerCase() === 'upi' && transactionId) {
            userData.transactionId = transactionId;
        }

        const user = new User(userData);
        await user.save();

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
            registrationId: user.registrationId 
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
app.post('/api/admins', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const defaultPassword = generateDefaultPassword();
        
        const admin = new Admin({ name, email, password: defaultPassword, role: role || 'admin', isActive: true, isPasswordChanged: false });
        await admin.save();
        
        res.status(201).json({ success: true, message: 'Admin created successfully', data: { name, email, role: admin.role, defaultPassword } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
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
app.delete('/api/admins/:id', async (req, res) => {
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

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (admin.role === 'super_admin') {
            const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
            if (superAdminCount === 1) {
                return res.status(400).json({ success: false, message: 'Cannot delete the only Super Admin user' });
            }
        }

        await Admin.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Error deleting employee', error: error.message });
    }
});

// ==================== PAYMENT ENDPOINTS ====================

// Get all payments
app.get('/api/admin/payments', verifyAdminToken, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }
        
        const payments = await Payment.find(query).sort({ paymentDate: -1, createdAt: -1 });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
});

// Create new payment
app.post('/api/admin/payments', verifyAdminToken, async (req, res) => {
    try {
        const { studentId, studentName, amount, paymentDate, status, paymentMethod, transactionId, remarks } = req.body;
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        let finalTransactionId = transactionId;
        if (!finalTransactionId) {
            const prefix = 'TXN';
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const count = await Payment.countDocuments();
            finalTransactionId = `${prefix}${year}${month}${String(count + 1).padStart(6, '0')}`;
        }
        
        const payment = new Payment({
            studentId,
            studentName,
            registrationId: student.registrationId,
            amount,
            paymentDate: paymentDate || new Date(),
            status,
            paymentMethod,
            transactionId: finalTransactionId,
            remarks
        });
        
        await payment.save();
        
        if (status === 'completed') {
            student.paymentStatus = 'completed';
            student.paymentDate = paymentDate;
            student.paymentMethod = paymentMethod;
            student.transactionId = finalTransactionId;
            await student.save();
        }
        
        res.status(201).json({ success: true, message: 'Payment created successfully', data: payment });
    } catch (error) {
        console.error('Error creating payment:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Transaction ID already exists' });
        }
        res.status(500).json({ success: false, message: 'Error creating payment', error: error.message });
    }
});

// Update payment
app.put('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const { amount, paymentDate, status, paymentMethod, transactionId, remarks } = req.body;
        
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        if (amount) payment.amount = amount;
        if (paymentDate) payment.paymentDate = paymentDate;
        if (status) payment.status = status;
        if (paymentMethod) payment.paymentMethod = paymentMethod;
        if (transactionId) payment.transactionId = transactionId;
        if (remarks !== undefined) payment.remarks = remarks;
        payment.updatedAt = new Date();
        
        await payment.save();
        
        if (status === 'completed') {
            const student = await User.findById(payment.studentId);
            if (student) {
                student.paymentStatus = 'completed';
                student.paymentDate = paymentDate || payment.paymentDate;
                student.paymentMethod = paymentMethod || payment.paymentMethod;
                student.transactionId = transactionId || payment.transactionId;
                await student.save();
            }
        }
        
        res.status(200).json({ success: true, message: 'Payment updated successfully', data: payment });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, message: 'Error updating payment', error: error.message });
    }
});

// Delete payment
app.delete('/api/admin/payments/:paymentId', verifyAdminToken, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        await Payment.findByIdAndDelete(req.params.paymentId);
        res.status(200).json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ success: false, message: 'Error deleting payment', error: error.message });
    }
});

// Get payment statistics
app.get('/api/admin/payments/stats', verifyAdminToken, async (req, res) => {
    try {
        const payments = await Payment.find();
        
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const completedAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
        const successRate = totalRevenue > 0 ? Math.round((completedAmount / totalRevenue) * 100) : 0;
        
        res.status(200).json({ 
            success: true, 
            data: {
                totalRevenue,
                completedAmount,
                pendingAmount,
                successRate,
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