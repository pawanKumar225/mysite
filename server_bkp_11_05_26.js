

// // server.js - Complete working version
// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({
//     origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intense')
// .then(() => console.log('✅ MongoDB Connected'))
// .catch(err => console.error('❌ MongoDB Error:', err));

// // JWT Secret
// const JWT_SECRET = process.env.JWT_SECRET || 'intense_beauty_academy_jwt_secret_2026';

// // ==================== ADMIN SCHEMA ====================

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
//     },phone: {
//     type: String,
//     trim: true,
//     default: ''
// },
// department: {
//     type: String,
//     default: 'General',
//     trim: true
// },
// salary: {
//     type: String,
//     default: '$0'
// }
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

// // ==================== HELPER FUNCTIONS ====================

// // Generate random default password
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
    
//     return password.split('').sort(() => 0.5 - Math.random()).join('');
// };

// // Send welcome email function
// const sendWelcomeEmail = async (userData, defaultPassword) => {
//     const { name, email, role, employeeId } = userData;
//     const loginUrl = 'http://localhost:5173/admin/change-password';
    
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
// // Generate JWT Token
// const generateToken = (adminId, email, role) => {
//     return jwt.sign(
//         { id: adminId, email: email, role: role },
//         JWT_SECRET,
//         { expiresIn: '7d' }
//     );
// };

// // ==================== LOGIN API ====================
// app.post('/api/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         console.log("email..........", email, "password...........", password);
//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide email and password'
//             });
//         }
        
//         const admin = await Admin.findOne({ email }).select('+password');
//         console.log("Admin Found:", admin);
//         if (!admin) {
//             console.log("Not Admin...........")
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         if (admin.isLocked()) {
//             const unlockTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
//             return res.status(401).json({
//                 success: false,
//                 message: `Account locked. Try again after ${unlockTime} minutes`
//             });
//         }
        
//         if (!admin.isActive) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Account is deactivated'
//             });
//         }
        
//         const isPasswordValid = await admin.comparePassword(password);
        
//         if (!isPasswordValid) {
//             console.log("Password not Valid...........")
//             admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            
//             if (admin.loginAttempts >= 5) {
//                 console.log("login Attempts...............")
//                 admin.lockUntil = Date.now() + 30 * 60 * 1000;
//                 await admin.save();
//                 return res.status(401).json({
//                     success: false,
//                     message: 'Account locked due to multiple failed attempts'
//                 });
//             }
            
//             await admin.save();
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }
        
//         // Reset login attempts
//         admin.loginAttempts = 0;
//         admin.lockUntil = undefined;
//         admin.lastLogin = new Date();
//         await admin.save();
        
//         const token = generateToken(admin._id, admin.email, admin.role);
        
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
// });

// // ==================== CREATE ADMIN API ====================
// app.post('/api/admins', async (req, res) => {
//     try {
//         const { name, email, role } = req.body;
        
//         if (!name || !email) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Name and email are required'
//             });
//         }
        
//         const existingAdmin = await Admin.findOne({ email });
//         if (existingAdmin) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'User with this email already exists'
//             });
//         }
        
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
        
//         const defaultPassword = generateDefaultPassword();
        
//         const admin = new Admin({ 
//             name, 
//             email, 
//             password: defaultPassword, 
//             role: dbRole,
//             isActive: true,
//             isPasswordChanged: false
//         });
        
//         await admin.save();
        
//         const adminResponse = admin.toObject();
//         delete adminResponse.password;
        
//         res.status(201).json({
//             success: true,
//             message: 'User created successfully',
//             data: {
//                 ...adminResponse,
//                 defaultPassword: process.env.NODE_ENV === 'development' ? defaultPassword : undefined
//             }
//         });
        
//     } catch (error) {
//         console.error('Create admin error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating user',
//             error: error.message
//         });
//     }
// });

// // ==================== CHANGE PASSWORD API ====================
// app.post('/api/change-password', async (req, res) => {
//     try {
//         // Get token from Authorization header
//         const token = req.headers.authorization?.split(' ')[1];
//         console.log("Token............", token)
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No token provided. Please login again.'
//             });
//         }

//         // Verify JWT token
//         let decoded;
//         try {
//             decoded = jwt.verify(token, JWT_SECRET);
//         } catch (err) {
//             if (err.name === 'TokenExpiredError') {
//                 return res.status(401).json({
//                     success: false,
//                     message: 'Session expired. Please login again.'
//                 });
//             }
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid token. Please login again.'
//             });
//         }
        
//         const { oldPassword, newPassword } = req.body;
        
//         // Validate input
//         if (!oldPassword || !newPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Current password and new password are required'
//             });
//         }
        
//         // Validate new password strength
//         if (newPassword.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'New password must be at least 6 characters long'
//             });
//         }
        
//         // Optional: Add more password strength validation
//         const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//         if (!passwordRegex.test(newPassword)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
//             });
//         }
        
//         // Find admin by ID and include password field
//         const admin = await Admin.findById(decoded.id).select('+password');
        
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         // Verify old password
//         const isPasswordValid = await admin.comparePassword(oldPassword);
        
//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Current password is incorrect'
//             });
//         }
        
//         // Check if new password is same as old password
//         const isSamePassword = await admin.comparePassword(newPassword);
//         if (isSamePassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'New password cannot be the same as current password'
//             });
//         }
        
//         // Update password
//         admin.password = newPassword;
//         admin.isPasswordChanged = true;
//         admin.passwordChangedAt = new Date();
//         await admin.save();
        
//         console.log(`✅ Password changed for user: ${admin.email}`);
        
//         res.status(200).json({
//             success: true,
//             message: 'Password changed successfully. Please login with your new password.'
//         });
        
//     } catch (error) {
//         console.error('Change password error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to change password',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// });

// // ==================== GET ALL ADMINS ====================
// app.get('/api/admins', async (req, res) => {
//     try {
//         const admins = await Admin.find().select('-password -loginAttempts -lockUntil').sort({ createdAt: -1 });
//         res.status(200).json({
//             success: true,
//             count: admins.length,
//             data: admins
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching users',
//             error: error.message
//         });
//     }
// });

// // ==================== GET SINGLE ADMIN ====================
// app.get('/api/admins/:id', async (req, res) => {
//     try {
//         const admin = await Admin.findById(req.params.id).select('-password -loginAttempts -lockUntil');
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
//         res.status(200).json({
//             success: true,
//             data: admin
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching user',
//             error: error.message
//         });
//     }
// });

// // ==================== HEALTH CHECK ====================
// app.get('/api/health', (req, res) => {
//     res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
// });
// app.get('/test-db', async (req, res) => {
//    try {
//       const admins = await Admin.find();

//       res.json({
//          success: true,
//          count: admins.length,
//          data: admins
//       });

//    } catch (error) {
//       console.log(error);

//       res.status(500).json({
//          success: false,
//          error: error.message
//       });
//    }
// });

// // ==================== UPDATE ADMIN (EDIT) ====================
// app.put('/api/admins/:id', async (req, res) => {
//     try {
//         // Verify JWT token
//         const token = req.headers.authorization?.split(' ')[1];
//         console.log("Token................", req.headers.authorization?.split(' ')[1], "req Body...........", req.headers)
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No token provided'
//             });
//         }

//         try {
//             jwt.verify(token, JWT_SECRET);
//         } catch (err) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid or expired token'
//             });
//         }

//         const { id } = req.params;
//         const { name, email, role, phone, department, salary, status } = req.body;

//         // Check if admin exists
//         const admin = await Admin.findById(id);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Employee not found'
//             });
//         }

//         // Check if email already exists for another user
//         if (email && email !== admin.email) {
//             const existingAdmin = await Admin.findOne({ email, _id: { $ne: id } });
//             if (existingAdmin) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Email already exists'
//                 });
//             }
//         }

//         // Update fields
//         if (name) admin.name = name;
//         if (email) admin.email = email;
//         if (role) admin.role = role;
//         if (phone) admin.phone = phone;
//         if (department) admin.department = department;
//         if (salary) admin.salary = salary;
//         if (status !== undefined) admin.isActive = status === 'Active';

//         await admin.save();

//         const updatedAdmin = admin.toObject();
//         delete updatedAdmin.password;

//         res.status(200).json({
//             success: true,
//             message: 'Employee updated successfully',
//             data: updatedAdmin
//         });

//     } catch (error) {
//         console.error('Update admin error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating employee',
//             error: error.message
//         });
//     }
// });

// // ==================== DELETE ADMIN ====================
// app.delete('/api/admins/:id', async (req, res) => {
//     try {
//         // Verify JWT token
//         const token = req.headers.authorization?.split(' ')[1];
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No token provided'
//             });
//         }

//         try {
//             jwt.verify(token, JWT_SECRET);
//         } catch (err) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid or expired token'
//             });
//         }

//         const { id } = req.params;

//         // Check if admin exists
//         const admin = await Admin.findById(id);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Employee not found'
//             });
//         }

//         // Prevent deletion of super_admin if it's the only one
//         if (admin.role === 'super_admin') {
//             const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
//             if (superAdminCount === 1) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Cannot delete the only Super Admin user'
//                 });
//             }
//         }

//         await Admin.findByIdAndDelete(id);

//         res.status(200).json({
//             success: true,
//             message: 'Employee deleted successfully'
//         });

//     } catch (error) {
//         console.error('Delete admin error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting employee',
//             error: error.message
//         });
//     }
// });

// // Add phone, department, salary fields to admin schema if not already present
// // Update your adminSchema to include these fields:
// /*
// phone: {
//     type: String,
//     trim: true
// },
// department: {
//     type: String,
//     default: 'General'
// },
// salary: {
//     type: String,
//     default: '$0'
// }
// */
// // ==================== START SERVER ====================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`\n🚀 Server running on http://localhost:${PORT}`);
//     console.log(`📡 API Endpoints:`);
//     console.log(`   POST   http://localhost:${PORT}/api/login`);
//     console.log(`   POST   http://localhost:${PORT}/api/admins`);
//     console.log(`   POST   http://localhost:${PORT}/api/change-password`);
//     console.log(`   GET    http://localhost:${PORT}/api/admins`);
//     console.log(`   GET    http://localhost:${PORT}/api/health\n`);
// });


// server.js - Complete working version with User Password Support
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

// Generate random default password for users
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

// Send welcome email to registered user with password
const sendWelcomeEmail = async (userData, defaultPassword) => {
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
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
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
                            <li>Never share your password with anyone.</li>
                            <li>Keep your Registration ID for future reference.</li>
                            <li>Use your email and password to access the student portal.</li>
                        </ul>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Login to your student portal using your email and password</li>
                        <li>Change your password immediately after first login</li>
                        <li>Complete your profile information</li>
                        <li>Access course materials and schedules</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/student/login" class="button">🔐 Login to Student Portal</a>
                        <a href="http://localhost:5173/student/change-password" class="button" style="background: linear-gradient(135deg, #667eea, #764ba2);">🔄 Change Password</a>
                    </div>
                    
                    <p style="margin-top: 20px;">For any queries, please contact us at:<br>
                    📞 +91-XXXXXXXXXX<br>
                    📧 support@intensebeautyacademy.com</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Intense Beauty Academy. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        try {
            await transporter.sendMail({
                from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Welcome to Intense Beauty Academy - Your Login Credentials (ID: ${registrationId})`,
                html: emailHTML
            });
            console.log('✅ Welcome email sent successfully to:', email);
            return { success: true };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    } else {
        console.log('⚠️ Email not configured. Skipping email sending.');
        console.log('Default password would be:', defaultPassword);
        return { success: false, error: 'Email not configured' };
    }
};

// ==================== REGISTRATION API WITH PASSWORD ====================

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
            password: defaultPassword,  // Will be hashed by pre-save hook
            isPasswordChanged: false,
            status: 'pending'
        });
        
        await user.save();
        
        // Send welcome email with password
        await sendWelcomeEmail({
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

// ==================== USER LOGIN API ====================

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
        
        if (user.isLocked()) {
            const unlockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(401).json({
                success: false,
                message: `Account locked. Try again after ${unlockTime} minutes`
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
        
        // Generate JWT token for user
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
            data: { user: userData, token }
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

// ==================== USER CHANGE PASSWORD API ====================

app.post('/api/user/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log("req.headers................", req)
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login again.'
            });
        }
        
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
        
        const user = await User.findById(decoded.id).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const isPasswordValid = await user.comparePassword(oldPassword);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password'
            });
        }
        
        // Update password
        user.password = newPassword;
        user.isPasswordChanged = true;
        user.lastPasswordChange = new Date();
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please login with your new password.'
        });
        
    } catch (error) {
        console.error('User change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});


app.post('/api/user/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email address'
            });
        }
        
        // Generate new temporary password
        const newPassword = generateDefaultPassword();
        user.password = newPassword;
        user.isPasswordChanged = false;
        await user.save();
        
        // Send email with new password
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff6b6b, #ff8e8e); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .password-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                    .new-password { font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.name},</h2>
                        <p>Your password has been reset as requested.</p>
                        <div class="password-box">
                            <p><strong>Your New Password:</strong></p>
                            <p class="new-password">${newPassword}</p>
                        </div>
                        <p><strong>Important:</strong> Please login with this temporary password and change it immediately.</p>
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/student/login" style="display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            await transporter.sendMail({
                from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset - Intense Beauty Academy',
                html: emailHTML
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'A new password has been sent to your email address.'
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

// ==================== GET USER PROFILE ====================

app.get('/api/user/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// ==================== GET ALL USERS (Admin only) ====================

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

// ==================== ADMIN APIs (Keep existing ones) ====================

// Generate random default password for admins
const generateAdminDefaultPassword = () => {
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

// Send admin welcome email
const sendAdminWelcomeEmail = async (userData, defaultPassword) => {
    const { name, email, role, employeeId } = userData;
    const loginUrl = 'http://localhost:5173/admin/change-password';
    
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
            <style>
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
                .credentials { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .credential-item { margin: 12px 0; }
                .credential-label { font-weight: bold; color: #667eea; display: inline-block; width: 140px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Intense Beauty Academy!</h1>
                </div>
                <div class="credentials">
                    <div class="credential-item">
                        <span class="credential-label">Employee ID:</span>
                        <span>${employeeId}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span>${email}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Default Password:</span>
                        <span>${defaultPassword}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Role:</span>
                        <span>${roleDisplay[role] || role}</span>
                    </div>
                </div>
                <div style="text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Login & Change Password</a>
                </div>
            </div>
        </body>
        </html>
    `;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        try {
            await transporter.sendMail({
                from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Welcome to Intense Beauty Academy - Your Account Credentials (ID: ${employeeId})`,
                html: emailHTML
            });
            console.log('✅ Email sent successfully to:', email);
            return { success: true };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false };
        }
    }
    return { success: false };
};

// Generate JWT Token for Admin
const generateAdminToken = (adminId, email, role) => {
    return jwt.sign(
        { id: adminId, email: email, role: role, type: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};


// ==================== LOGIN API ====================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("email..........", email, "password...........", password);
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        const admin = await Admin.findOne({ email }).select('+password');
        console.log("Admin Found:", admin);
        if (!admin) {
            console.log("Not Admin...........")
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
            console.log("Password not Valid...........")
            admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            
            if (admin.loginAttempts >= 5) {
                console.log("login Attempts...............")
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
        
        const token = generateAdminToken(admin._id, admin.email, admin.role);
        
        const adminData = admin.toObject();
        delete adminData.password;
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                admin: adminData, 
                token,
                requiresPasswordChange: !admin.isPasswordChanged // Add this flag
            }
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
// app.post('/api/change-password', async (req, res) => {
//     try {
//         // Get token from Authorization header
//         const token = req.headers.authorization?.split(' ')[1];
//         console.log("Token............", token)
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No token provided. Please login again.'
//             });
//         }

//         // Verify JWT token
//         let decoded;
//         try {
//             decoded = jwt.verify(token, JWT_SECRET);
//         } catch (err) {
//             if (err.name === 'TokenExpiredError') {
//                 return res.status(401).json({
//                     success: false,
//                     message: 'Session expired. Please login again.'
//                 });
//             }
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid token. Please login again.'
//             });
//         }
        
//         const { oldPassword, newPassword } = req.body;
        
//         // Validate input
//         if (!oldPassword || !newPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Current password and new password are required'
//             });
//         }
        
//         // Validate new password strength
//         if (newPassword.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'New password must be at least 6 characters long'
//             });
//         }
        
//         // Optional: Add more password strength validation
//         const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//         if (!passwordRegex.test(newPassword)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
//             });
//         }
        
//         // Find admin by ID and include password field
//         const admin = await Admin.findById(decoded.id).select('+password');
        
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }
        
//         // Verify old password
//         const isPasswordValid = await admin.comparePassword(oldPassword);
        
//         if (!isPasswordValid) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Current password is incorrect'
//             });
//         }
        
//         // Check if new password is same as old password
//         const isSamePassword = await admin.comparePassword(newPassword);
//         if (isSamePassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'New password cannot be the same as current password'
//             });
//         }
        
//         // Update password
//         admin.password = newPassword;
//         admin.isPasswordChanged = true;
//         admin.passwordChangedAt = new Date();
//         await admin.save();
        
//         console.log(`✅ Password changed for user: ${admin.email}`);
        
//         res.status(200).json({
//             success: true,
//             message: 'Password changed successfully. Please login with your new password.'
//         });
        
//     } catch (error) {
//         console.error('Change password error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to change password',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// });
app.post('/api/change-password', async (req, res) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        
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
            // Verify it's an admin token
            if (decoded.type !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only endpoint.'
                });
            }
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
        
        // Admin-specific validations
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        // Admin password policy (stricter)
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Admin password must be at least 8 characters long'
            });
        }
        
        // Strong password regex for admin
        const adminPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!adminPasswordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Admin password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
            });
        }
        
        // Find admin by ID and include password field
        const admin = await Admin.findById(decoded.id).select('+password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        // Verify old password
        const isPasswordValid = await admin.comparePassword(oldPassword);
        
        if (!isPasswordValid) {
            // Track failed attempts for admin
            admin.loginAttempts = (admin.loginAttempts || 0) + 1;
            if (admin.loginAttempts >= 3) {
                admin.isActive = false; // Lock admin account after 3 failed attempts
                await admin.save();
                return res.status(401).json({
                    success: false,
                    message: 'Account locked due to multiple failed attempts. Contact super admin.'
                });
            }
            await admin.save();
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
        admin.loginAttempts = 0; // Reset login attempts
        await admin.save();
        
        // Send admin-specific email notification
        await sendAdminPasswordChangeEmail(admin.email, admin.name);
        
        console.log(`✅ Admin password changed for: ${admin.email}`);
        
        res.status(200).json({
            success: true,
            message: 'Admin password changed successfully. Please login with your new password.'
        });
        
    } catch (error) {
        console.error('Admin change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change admin password',
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

app.post('/api/admin/first-time-password', async (req, res) => {
    try {
        // Get token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        
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
            // Verify it's an admin token
            if (decoded.type !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin only endpoint.'
                });
            }
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
        
        const { newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }
        
        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }
        
        // Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }
        
        // Strong password regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }
        
        // Find admin by ID and include password field
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
        
        // Send password change confirmation email
        await sendPasswordChangeConfirmationEmail(admin.email, admin.name);
        
        console.log(`✅ First-time password changed for admin: ${admin.email}`);
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully! Please login with your new password.'
        });
        
    } catch (error) {
        console.error('First-time password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// ==================== FORGOT PASSWORD API ====================

app.get('/test-db', async (req, res) => {
   try {
      const admins = await Admin.find();

      res.json({
         success: true,
         count: admins.length,
         data: admins
      });

   } catch (error) {
      console.log(error);

      res.status(500).json({
         success: false,
         error: error.message
      });
   }
});

// ==================== UPDATE ADMIN (EDIT) ====================
app.put('/api/admins/:id', async (req, res) => {
    try {
        // Verify JWT token
        const token = req.headers.authorization?.split(' ')[1];
        console.log("Token................", req.headers.authorization?.split(' ')[1], "req Body...........", req.headers)
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;
        const { name, email, role, phone, department, salary, status } = req.body;

        // Check if admin exists
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if email already exists for another user
        if (email && email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email, _id: { $ne: id } });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Update fields
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

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: updatedAdmin
        });

    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
});

// ==================== DELETE ADMIN ====================
app.delete('/api/admins/:id', async (req, res) => {
    try {
        // Verify JWT token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        try {
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;

        // Check if admin exists
        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Prevent deletion of super_admin if it's the only one
        if (admin.role === 'super_admin') {
            const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
            if (superAdminCount === 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the only Super Admin user'
                });
            }
        }

        await Admin.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully'
        });

    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message
        });
    }
});

// Add phone, department, salary fields to admin schema if not already present
// Update your adminSchema to include these fields:
/*
phone: {
    type: String,
    trim: true
},
department: {
    type: String,
    default: 'General'
},
salary: {
    type: String,
    default: '$0'
}
*/
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        timestamp: new Date(),
        endpoints: {
            user_register: 'POST /api/register',
            user_login: 'POST /api/user/login',
            user_change_password: 'POST /api/user/change-password',
            user_forgot_password: 'POST /api/user/forgot-password',
            admin_login: 'POST /api/admin/login',
            admin_create: 'POST /api/admins',
            admin_change_password: 'POST /api/admin/change-password'
        }
    });
});

// Helper function: Send password change confirmation email
const sendPasswordChangeConfirmationEmail = async (email, name) => {
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
                .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
                .warning { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px; }
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
                    <p>Your administrator account password has been successfully changed.</p>
                    
                    <div class="warning">
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
                        <li>Enable two-factor authentication if available</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/admin/login" class="button">Login with New Password</a>
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
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        try {
            await transporter.sendMail({
                from: `"Intense Beauty Academy" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Changed Successfully - Intense Beauty Academy',
                html: emailHTML
            });
            console.log('✅ Password change confirmation email sent to:', email);
            return { success: true };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false };
        }
    }
    return { success: false };
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`\n👤 User APIs:`);
    console.log(`   POST   http://localhost:${PORT}/api/register`);
    console.log(`   POST   http://localhost:${PORT}/api/user/login`);
    console.log(`   POST   http://localhost:${PORT}/api/user/change-password`);
    console.log(`   POST   http://localhost:${PORT}/api/user/forgot-password`);
    console.log(`   GET    http://localhost:${PORT}/api/user/profile`);
    console.log(`\n👨‍💼 Admin APIs:`);
    console.log(`   POST   http://localhost:${PORT}/api/admin/login`);
    console.log(`   POST   http://localhost:${PORT}/api/admins`);
    console.log(`   POST   http://localhost:${PORT}/api/admin/change-password`);
    console.log(`   GET    http://localhost:${PORT}/api/users`);
    console.log(`   GET    http://localhost:${PORT}/api/admins`);
    console.log(`   GET    http://localhost:${PORT}/api/health\n`);
});