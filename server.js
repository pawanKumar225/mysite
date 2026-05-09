// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
// const cors = require('cors'); 
// const app = express();
// const nodemailer = require('nodemailer');
// require('dotenv').config();
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow frontend origins
//   credentials: true, // Allow cookies/auth headers
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // Allowed headers
// }));

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // MongoDB Connection
// mongoose.connect('mongodb://localhost:27017/admin_db')
// .then(() => console.log('✅ MongoDB Connected'))
// .catch(err => console.error('❌ MongoDB Error:', err));
// // Generate random default password (10 characters with special chars)
// const generateDefaultPassword = () => {
//     const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//     const lowercase = 'abcdefghijklmnopqrstuvwxyz';
//     const numbers = '0123456789';
//     const special = '!@#$%';
    
//     let password = '';
//     password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
//     password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
//     password += numbers.charAt(Math.floor(Math.random() * numbers.length));
//     password += special.charAt(Math.floor(Math.random() * special.length));
    
//     const allChars = uppercase + lowercase + numbers + special;
//     for (let i = password.length; i < 10; i++) {
//         password += allChars.charAt(Math.floor(Math.random() * allChars.length));
//     }
    
//     // Shuffle the password
//     return password.split('').sort(() => 0.5 - Math.random()).join('');
// };

// // Send welcome email function
// const sendWelcomeEmail = async (userData, defaultPassword) => {
//     const { name, email, role, employeeId } = userData;
//     const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';
    
//     const roleDisplay = {
//         'super_admin': 'Super Administrator',
//         'hr_manager': 'HR Manager',
//         'admin': 'Admin',
//         'employee': 'Employee'
//     };
    
//     const emailHTML = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Welcome to Intense Beauty Academy</title>
//             <style>
//                 body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
//                 .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
//                 .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
//                 .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//                 .credentials { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
//                 .credential-item { margin: 12px 0; font-size: 16px; }
//                 .credential-label { font-weight: bold; color: #667eea; min-width: 120px; display: inline-block; }
//                 .credential-value { font-family: monospace; font-size: 16px; background: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
//                 .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
//                 .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
//                 .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <div class="header">
//                     <h1>Welcome to Intense Beauty Academy!</h1>
//                     <p>Your account has been created successfully</p>
//                 </div>
//                 <div class="content">
//                     <h2>Hello ${name},</h2>
//                     <p>Your account has been created with the following credentials:</p>
//                     <div class="credentials">
//                         <div class="credential-item">
//                             <span class="credential-label">🆔 Employee ID:</span>
//                             <span class="credential-value">${employeeId}</span>
//                         </div>
//                         <div class="credential-item">
//                             <span class="credential-label">📧 Email:</span>
//                             <span class="credential-value">${email}</span>
//                         </div>
//                         <div class="credential-item">
//                             <span class="credential-label">🔑 Default Password:</span>
//                             <span class="credential-value">${defaultPassword}</span>
//                         </div>
//                         <div class="credential-item">
//                             <span class="credential-label">👔 Role:</span>
//                             <span class="credential-value">${roleDisplay[role] || role}</span>
//                         </div>
//                     </div>
//                     <div class="warning">
//                         <strong>⚠️ Important Security Notice:</strong>
//                         <ul>
//                             <li>This is your default password. Please change it after your first login.</li>
//                             <li>Never share your password with anyone.</li>
//                             <li>Keep your Employee ID for future reference.</li>
//                         </ul>
//                     </div>
//                     <div style="text-align: center;">
//                         <a href="${loginUrl}" class="button">🔐 Login to Your Account</a>
//                     </div>
//                 </div>
//                 <div class="footer">
//                     <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
//                     <p>This is an automated message, please do not reply.</p>
//                 </div>
//             </div>
//         </body>
//         </html>
//     `;
    
//     // Create transporter only if email credentials are provided
//     if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
//         const transporter = nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             port: 587,
//             secure: false,
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });
        
//         try {
//             await transporter.sendMail({
//                 from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
//                 to: email,
//                 subject: `Welcome to Intense Beauty Academy - Your Account Credentials (ID: ${employeeId})`,
//                 html: emailHTML
//             });
//             console.log('✅ Email sent successfully to:', email);
//             return { success: true };
//         } catch (error) {
//             console.error('❌ Email sending failed:', error);
//             return { success: false, error: error.message };
//         }
//     } else {
//         console.log('⚠️ Email not configured. Skipping email sending.');
//         return { success: false, error: 'Email not configured' };
//     }
// };
// // Email transporter setup
// const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL_USER || 'your-email@gmail.com',
//         pass: process.env.EMAIL_PASS || 'your-app-password'
//     }
// });


// app.use((req, res, next) => {
//   const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
//   const origin = req.headers.origin;
  
//   if (allowedOrigins.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', origin);
//   }
  
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
  
//   next();
// });
// // Configuration
// const JWT_SECRET = 'your_super_secret_key_change_this_in_production';
// // const PORT = process.env.PORT || 5000;

// // admin schema
// const adminSchema = new mongoose.Schema({
//     employeeId: {
//         type: String,
//         unique: true,
//         sparse: true
//     },
//     name: {
//         type: String,
//         required: [true, 'Name is required'],
//         trim: true,
//         minlength: [2, 'Name must be at least 2 characters'],
//         maxlength: [50, 'Name cannot exceed 50 characters']
//     },
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         lowercase: true,
//         trim: true,
//         match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//     },
//     password: {
//         type: String,
//         required: [true, 'Password is required'],
//         minlength: [6, 'Password must be at least 6 characters'],
//         select: false
//     },
//     role: {
//         type: String,
//         enum: ['super_admin', 'hr_manager', 'admin', 'employee'],
//         default: 'employee'
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },
//     lastLogin: {
//         type: Date
//     },
//     isPasswordChanged: {
//         type: Boolean,
//         default: false
//     }
// });

// // Generate employee ID before saving
// adminSchema.pre('save', async function(next) {
//     if (this.isNew && !this.employeeId) {
//         const prefix = 'IBA';
//         const currentYear = new Date().getFullYear();
        
//         const lastAdmin = await this.constructor.findOne(
//             { employeeId: { $regex: `^${prefix}-${currentYear}` } },
//             { employeeId: 1 },
//             { sort: { employeeId: -1 } }
//         );
        
//         let nextNumber = 1;
//         if (lastAdmin && lastAdmin.employeeId) {
//             const lastNumber = parseInt(lastAdmin.employeeId.split('-')[2]);
//             nextNumber = lastNumber + 1;
//         }
        
//         this.employeeId = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
//     }
//     next();
// });

// // Hash password middleware
// adminSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Compare password method
// adminSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
// };

// // Check if account is locked
// adminSchema.methods.isLocked = function() {
//     return this.lockUntil && this.lockUntil > Date.now();
// };

// const Admin = mongoose.model('Admin', adminSchema);

// // Generate JWT Token
// const generateToken = (adminId, email, role) => {
//     return jwt.sign(
//         { id: adminId, email: email, role: role },
//         JWT_SECRET,
//         { expiresIn: '7d' }
//     );
// };

// // Auth Middleware
// const protect = async (req, res, next) => {
//     let token;
    
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         token = req.headers.authorization.split(' ')[1];
//     } else if (req.cookies.token) {
//         token = req.cookies.token;
//     }
    
//     if (!token) {
//         return res.status(401).json({
//             success: false,
//             message: 'Not authorized. Please login first.'
//         });
//     }
    
//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid or expired token.'
//         });
//     }
// };

// // ============ LOGIN FUNCTION ============
// // const loginAdmin = async (req, res) => {
// //     try {
// //         const { email, password } = req.body;
        
// //         if (!email || !password) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Please provide email and password'
// //             });
// //         }
        
// //         const admin = await Admin.findOne({ email }).select('+password');
        
// //         if (!admin) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: 'Invalid credentials'
// //             });
// //         }
        
// //         if (admin.isLocked()) {
// //             const unlockTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
// //             return res.status(401).json({
// //                 success: false,
// //                 message: `Account locked. Try again after ${unlockTime} minutes`
// //             });
// //         }
        
// //         if (!admin.isActive) {
// //             return res.status(401).json({
// //                 success: false,
// //                 message: 'Account is deactivated'
// //             });
// //         }
        
// //         const isPasswordValid = await admin.comparePassword(password);
        
// //         if (!isPasswordValid) {
// //             admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            
// //             if (admin.loginAttempts >= 5) {
// //                 admin.lockUntil = Date.now() + 30 * 60 * 1000;
// //                 await admin.save();
// //                 return res.status(401).json({
// //                     success: false,
// //                     message: 'Account locked due to multiple failed attempts'
// //                 });
// //             }
            
// //             await admin.save();
// //             return res.status(401).json({
// //                 success: false,
// //                 message: 'Invalid credentials'
// //             });
// //         }
        
// //         // Reset login attempts
// //         admin.loginAttempts = 0;
// //         admin.lockUntil = undefined;
// //         admin.lastLogin = new Date();
// //         await admin.save();
        
// //         const token = generateToken(admin._id, admin.email, admin.role);
        
// //         const adminData = {
// //             _id: admin._id,
// //             name: admin.name,
// //             email: admin.email,
// //             role: admin.role,
// //             isActive: admin.isActive,
// //             lastLogin: admin.lastLogin
// //         };
        
// //         // Set cookie
// //         res.cookie('token', token, {
// //             expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
// //             httpOnly: true,
// //             secure: process.env.NODE_ENV === 'production'
// //         });
        
// //         res.status(200).json({
// //             success: true,
// //             message: 'Login successful',
// //             data: { admin: adminData, token }
// //         });
        
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Login failed',
// //             error: error.message
// //         });
// //     }
// // };

// const loginAdmin = async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide email and password'
//             });
//         }
        
//         const admin = await Admin.findOne({ email }).select('+password');
        
//         if (!admin) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         const isPasswordValid = await admin.comparePassword(password);
        
//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         // Update last login
//         admin.lastLogin = new Date();
//         await admin.save();
        
//         // Generate JWT token
//         const token = jwt.sign(
//             { id: admin._id, email: admin.email, role: admin.role },
//             process.env.JWT_SECRET || 'your_secret_key',
//             { expiresIn: '7d' }
//         );
        
//         const adminData = admin.toObject();
//         delete adminData.password;
        
//         res.status(200).json({
//             success: true,
//             message: 'Login successful',
//             data: { admin: adminData, token }
//         });
        
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error logging in',
//             error: error.message
//         });
//     }
// };
// // ============ CREATE ADMIN ============


// const createAdmin = async (req, res) => {
//     try {
//         const { name, email, role } = req.body;
        
//         // Validate required fields
//         if (!name || !email) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Name and email are required'
//             });
//         }
        
//         // Check if admin already exists
//         // const existingAdmin = await Admin.findOne({ email });
//         // if (existingAdmin) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'Admin already exists with this email'
//         //     });
//         // }
        
//         // Map role from UI to database enum
//         let dbRole = 'employee';
//         switch(role) {
//             case 'Super Admin':
//                 dbRole = 'super_admin';
//                 break;
//             case 'HR Manager':
//                 dbRole = 'hr_manager';
//                 break;
//             case 'Admin':
//                 dbRole = 'admin';
//                 break;
//             case 'Employee':
//                 dbRole = 'employee';
//                 break;
//             default:
//                 dbRole = role || 'employee';
//         }
        
//         // Generate default password
//         const defaultPassword = generateDefaultPassword();
        
//         // Create admin with default password
//         const admin = new Admin({ 
//             name, 
//             email, 
//             password: defaultPassword, 
//             role: dbRole 
//         });
        
//         await admin.save();
        
//         // Send welcome email with credentials
//         const emailResult = await sendWelcomeEmail(
//             {
//                 name: admin.name,
//                 email: admin.email,
//                 role: admin.role,
//                 employeeId: admin.employeeId
//             },
//             defaultPassword
//         );
        
//         // Prepare response (remove sensitive data)
//         const adminResponse = admin.toObject();
//         delete adminResponse.password;
        
//         res.status(201).json({
//             success: true,
//             message: 'Admin created successfully. Credentials sent to email.',
//             data: {
//                 ...adminResponse,
//                 defaultPassword: defaultPassword // Only for development
//             },
//             emailSent: emailResult.success
//         });
        
//     } catch (error) {
//         console.error('Create admin error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating admin',
//             error: error.message
//         });
//     }
// };
// //  GET ALL ADMINS
// const getAllAdmins = async (req, res) => {
//     try {
//         const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
//         res.status(200).json({
//             success: true,
//             count: admins.length,
//             data: admins
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching admins',
//             error: error.message
//         });
//     }
// };

// //  GET SINGLE ADMIN
// const getAdminById = async (req, res) => {
//     try {
//         const admin = await Admin.findById(req.params.id).select('-password');
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         res.status(200).json({
//             success: true,
//             data: admin
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching admin',
//             error: error.message
//         });
//     }
// };

// //  UPDATE ADMIN
// const updateAdmin = async (req, res) => {
//     try {
//         const updates = req.body;
//         delete updates.password;
//         delete updates.employeeId;
        
//         const admin = await Admin.findByIdAndUpdate(
//             req.params.id,
//             updates,
//             { new: true, runValidators: true }
//         ).select('-password');
        
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
        
//         res.status(200).json({
//             success: true,
//             message: 'Admin updated successfully',
//             data: admin
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error updating admin',
//             error: error.message
//         });
//     }
// };
// // Change Password
// app.post('/api/change-password', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
    
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const { oldPassword, newPassword } = req.body;
    
//     const admin = await Admin.findById(decoded.id).select('+password');
    
//     if (!admin) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     const isMatch = await admin.comparePassword(oldPassword);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: 'Current password is incorrect' });
//     }
    
//     admin.password = newPassword;
//     admin.isPasswordChanged = true;
//     await admin.save();
    
//     res.json({ success: true, message: 'Password changed successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
// // ==================== DELETE ADMIN ====================
// const deleteAdmin = async (req, res) => {
//     try {
//         const admin = await Admin.findByIdAndDelete(req.params.id);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         res.status(200).json({
//             success: true,
//             message: 'Admin deleted successfully'
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting admin',
//             error: error.message
//         });
//     }
// };


// // ==================== ROUTES ====================
// app.post('/api/admins', createAdmin);           // Create admin (with auto password & email)
// app.post('/api/login', loginAdmin);              // Login
// app.get('/api/admins', getAllAdmins);            // Get all admins
// app.get('/api/admins/:id', getAdminById);        // Get single admin
// app.put('/api/admins/:id', updateAdmin);         // Update admin
// app.delete('/api/admins/:id', deleteAdmin);      // Delete admin

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//     res.json({ status: 'OK', message: 'Server is running' });
// });

// // ==================== START SERVER ====================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📡 API endpoints:`);
//     console.log(`   POST   http://localhost:${PORT}/api/admins`);
//     console.log(`   POST   http://localhost:${PORT}/api/login`);
//     console.log(`   GET    http://localhost:${PORT}/api/admins`);
//     console.log(`   GET    http://localhost:${PORT}/api/admins/:id`);
//     console.log(`   PUT    http://localhost:${PORT}/api/admins/:id`);
//     console.log(`   DELETE http://localhost:${PORT}/api/admins/:id`);
// });




// server.js - Complete working version
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
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty_academy_db')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

// ==================== ADMIN SCHEMA ====================
const adminSchema = new mongoose.Schema({
    employeeId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['super_admin', 'hr_manager', 'admin', 'employee'], default: 'employee' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    isPasswordChanged: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
});

// Generate employee ID before saving
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
            const parts = lastAdmin.employeeId.split('-');
            if (parts.length === 3) {
                const lastNumber = parseInt(parts[2]);
                nextNumber = lastNumber + 1;
            }
        }
        
        this.employeeId = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    }
    next();
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.passwordChangedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
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
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 10; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Generate JWT Token
const generateToken = (adminId, email, role) => {
    return jwt.sign(
        { id: adminId, email: email, role: role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// ==================== LOGIN API ====================
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
        
        if (admin.isLocked()) {
            const unlockTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
            return res.status(401).json({
                success: false,
                message: `Account locked. Try again after ${unlockTime} minutes`
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
        
        const token = generateToken(admin._id, admin.email, admin.role);
        
        const adminData = admin.toObject();
        delete adminData.password;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { admin: adminData, token }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
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
            case 'Super Admin':
                dbRole = 'super_admin';
                break;
            case 'HR Manager':
                dbRole = 'hr_manager';
                break;
            case 'Admin':
                dbRole = 'admin';
                break;
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
        
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                ...adminResponse,
                defaultPassword: process.env.NODE_ENV === 'development' ? defaultPassword : undefined
            }
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

// ==================== CHANGE PASSWORD API ====================
app.post('/api/change-password', async (req, res) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        console.log("Token............", token)
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login again.'
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        
        const { oldPassword, newPassword } = req.body;
        
        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        // Optional: Add more password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
            });
        }
        
        // Find admin by ID and include password field
        const admin = await Admin.findById(decoded.id).select('+password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify old password
        const isPasswordValid = await admin.comparePassword(oldPassword);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Check if new password is same as old password
        const isSamePassword = await admin.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password'
            });
        }
        
        // Update password
        admin.password = newPassword;
        admin.isPasswordChanged = true;
        admin.passwordChangedAt = new Date();
        await admin.save();
        
        console.log(`✅ Password changed for user: ${admin.email}`);
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login with your new password.'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== GET ALL ADMINS ====================
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

// ==================== GET SINGLE ADMIN ====================
app.get('/api/admins/:id', async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password -loginAttempts -lockUntil');
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   POST   http://localhost:${PORT}/api/login`);
    console.log(`   POST   http://localhost:${PORT}/api/admins`);
    console.log(`   POST   http://localhost:${PORT}/api/change-password`);
    console.log(`   GET    http://localhost:${PORT}/api/admins`);
    console.log(`   GET    http://localhost:${PORT}/api/health\n`);
});