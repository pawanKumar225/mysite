const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const API_BASE_URL = config.API_URL;

// class AdminService {
    
//     // Login Admin
//     async loginAdmin(email, password, req) {
//         try {
//             // Validation
//             if (!email || !password) {
//                 return {
//                     success: false,
//                     message: 'Please provide email and password'
//                 };
//             }

//             // Find admin with password field included
//             const admin = await Admin.findOne({ email }).select('+password');
            
//             // Check if admin exists
//             if (!admin) {
//                 return {
//                     success: false,
//                     message: 'Invalid credentials'
//                 };
//             }

//             // Check if account is locked
//             if (admin.isLocked()) {
//                 const unlockTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
//                 return {
//                     success: false,
//                     message: `Account is locked. Please try again after ${unlockTime} minutes`
//                 };
//             }

//             // Check if account is active
//             if (!admin.isActive) {
//                 return {
//                     success: false,
//                     message: 'Account is deactivated. Please contact administrator'
//                 };
//             }

//             // Verify password
//             const isPasswordValid = await admin.comparePassword(password);
            
//             if (!isPasswordValid) {
//                 // Increment login attempts
//                 admin.loginAttempts = (admin.loginAttempts || 0) + 1;
                
//                 // Lock account after 5 failed attempts
//                 if (admin.loginAttempts >= 5) {
//                     admin.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
//                     await admin.save();
//                     return {
//                         success: false,
//                         message: 'Account locked due to multiple failed attempts. Try again after 30 minutes'
//                     };
//                 }
                
//                 await admin.save();
//                 return {
//                     success: false,
//                     message: 'Invalid credentials'
//                 };
//             }

//             // Reset login attempts on successful login
//             admin.loginAttempts = 0;
//             admin.lockUntil = undefined;
//             admin.lastLogin = new Date();
//             await admin.save();

//             // Generate JWT Token
//             const token = generateToken(admin._id, admin.email, admin.role);
            
//             // Prepare admin data (remove sensitive info)
//             const adminData = {
//                 _id: admin._id,
//                 name: admin.name,
//                 email: admin.email,
//                 role: admin.role,
//                 isActive: admin.isActive,
//                 lastLogin: admin.lastLogin,
//                 createdAt: admin.createdAt
//             };

//             // Set cookie (optional)
//             const cookieOptions = {
//                 expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production',
//                 sameSite: 'strict'
//             };

//             return {
//                 success: true,
//                 message: 'Login successful',
//                 data: {
//                     admin: adminData,
//                     token: token
//                 },
//                 cookieOptions: cookieOptions
//             };

//         } catch (error) {
//             console.error('Login error:', error);
//             return {
//                 success: false,
//                 message: 'Login failed. Please try again later.',
//                 error: error.message
//             };
//         }
//     }

//     // Create new admin (existing method)
//      async createAdmin(adminData) {
//         try {
//             // Check if admin already exists
//             const existingAdmin = await Admin.findOne({ email: adminData.email });
//             if (existingAdmin) {
//                 return {
//                     success: false,
//                     message: 'Admin with this email already exists'
//                 };
//             }
            
//             // Generate default password
//             const defaultPassword = generateDefaultPassword();
            
//             // Create admin with default password
//             const admin = new Admin({
//                 name: adminData.name,
//                 email: adminData.email,
//                 password: defaultPassword, // Will be hashed by pre-save middleware
//                 role: adminData.role || 'employee',
//                 isActive: true,
//                 isPasswordChanged: false
//             });
            
//             await admin.save();
            
//             // Send welcome email with credentials
//             const emailResult = await sendWelcomeEmail(
//                 {
//                     name: admin.name,
//                     email: admin.email,
//                     role: admin.role
//                 },
//                 defaultPassword
//             );
            
//             // Prepare response (remove sensitive data)
//             const adminResponse = admin.toObject();
//             delete adminResponse.password;
//             delete adminResponse.defaultPassword;
            
//             return {
//                 success: true,
//                 message: 'Admin created successfully. Credentials sent to email.',
//                 data: adminResponse,
//                 emailSent: emailResult.success,
//                 defaultPassword: defaultPassword // Only for development
//             };
            
//         } catch (error) {
//             console.error('Create admin error:', error);
//             return {
//                 success: false,
//                 message: error.message || 'Failed to create admin'
//             };
//         }
//     }

//     // Get all admins (existing method)
//     async getAllAdmins() {
//         try {
//             const admins = await Admin.find().select('-password -defaultPassword');
//             return {
//                 success: true,
//                 data: admins
//             };
//         } catch (error) {
//             return {
//                 success: false,
//                 error: error.message
//             };
//         }
//     }
//     //update Admin
//     async updateAdmin(id, updateData) {
//         try {
//             // Remove sensitive fields
//             delete updateData.password;
//             delete updateData.defaultPassword;
            
//             const admin = await Admin.findByIdAndUpdate(
//                 id,
//                 updateData,
//                 { new: true, runValidators: true }
//             ).select('-password -defaultPassword');
            
//             if (!admin) {
//                 return {
//                     success: false,
//                     message: 'Admin not found'
//                 };
//             }
            
//             return {
//                 success: true,
//                 message: 'Admin updated successfully',
//                 data: admin
//             };
//         } catch (error) {
//             return {
//                 success: false,
//                 error: error.message
//             };
//         }
//     }

//     // Logout Admin
//     async logoutAdmin() {
//         return {
//             success: true,
//             message: 'Logged out successfully'
//         };
//     }

//     // Get current admin profile
//     async getCurrentAdmin(adminId) {
//         try {
//             const admin = await Admin.findById(adminId).select('-password');
//             if (!admin) {
//                 return {
//                     success: false,
//                     message: 'Admin not found'
//                 };
//             }
//             return {
//                 success: true,
//                 data: admin
//             };
//         } catch (error) {
//             return {
//                 success: false,
//                 error: error.message
//             };
//         }
//     }

//      // Delete admin
//     async deleteAdmin(id) {
//         try {
//             const admin = await Admin.findByIdAndDelete(id);
//             if (!admin) {
//                 return {
//                     success: false,
//                     message: 'Admin not found'
//                 };
//             }
//             return {
//                 success: true,
//                 message: 'Admin deleted successfully'
//             };
//         } catch (error) {
//             return {
//                 success: false,
//                 error: error.message
//             };
//         }
//     }
// }


class AdminService {
    // Login Admin
	async loginAdmin(email, password, req) {
        try {
            // Validation
            if (!email || !password) {
                return {
                    success: false,
                    message: 'Please provide email and password'
                };
            }

            // Find admin with password field included
            const admin = await Admin.findOne({ email }).select('+password');
            
            // Check if admin exists
            if (!admin) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // Check if account is locked
            if (admin.isLocked()) {
                const unlockTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
                return {
                    success: false,
                    message: `Account is locked. Please try again after ${unlockTime} minutes`
                };
            }

            // Check if account is active
            if (!admin.isActive) {
                return {
                    success: false,
                    message: 'Account is deactivated. Please contact administrator'
                };
            }

            // Verify password
            const isPasswordValid = await admin.comparePassword(password);
            
            if (!isPasswordValid) {
                // Increment login attempts
                admin.loginAttempts = (admin.loginAttempts || 0) + 1;
                
                // Lock account after 5 failed attempts
                if (admin.loginAttempts >= 5) {
                    admin.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
                    await admin.save();
                    return {
                        success: false,
                        message: 'Account locked due to multiple failed attempts. Try again after 30 minutes'
                    };
                }
                
                await admin.save();
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }

            // Reset login attempts on successful login
            admin.loginAttempts = 0;
            admin.lockUntil = undefined;
            admin.lastLogin = new Date();
            await admin.save();

            // Generate JWT Token
            const token = generateToken(admin._id, admin.email, admin.role);
            
            // Prepare admin data (remove sensitive info)
            const adminData = {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
                createdAt: admin.createdAt
            };

            // Set cookie (optional)
            const cookieOptions = {
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            };

            return {
                success: true,
                message: 'Login successful',
                data: {
                    admin: adminData,
                    token: token
                },
                cookieOptions: cookieOptions
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed. Please try again later.',
                error: error.message
            };
        }
    }
    // Create new admin with default password and employee ID
    async createAdmin(adminData) {
        try {
            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ email: adminData.email });
            if (existingAdmin) {
                return {
                    success: false,
                    message: 'User with this email already exists'
                };
            }
            
            // Generate default password
            const defaultPassword = generateDefaultPassword();
            
            // Map role from UI to database enum
            let dbRole = 'employee';
            switch(adminData.role) {
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
                    dbRole = adminData.role || 'employee';
            }
            
            // Create admin with default password
            const admin = new Admin({
                name: adminData.name,
                email: adminData.email,
                password: defaultPassword,
                role: dbRole,
                isActive: true,
                isPasswordChanged: false
            });
            
            await admin.save();
            
            // Send welcome email with credentials
            const emailResult = await sendWelcomeEmail(
                {
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    employeeId: admin.employeeId
                },
                defaultPassword
            );
            
            // Prepare response (remove sensitive data)
            const adminResponse = admin.toObject();
            delete adminResponse.password;
            
            return {
                success: true,
                message: 'User created successfully. Credentials sent to email.',
                data: {
                    ...adminResponse,
                    defaultPassword: defaultPassword // Only for development, remove in production
                },
                emailSent: emailResult.success
            };
            
        } catch (error) {
            console.error('Create admin error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create user'
            };
        }
    }
    
    // Get all admins
    async getAllAdmins() {
        try {
            const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
            return {
                success: true,
                data: admins
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get admin by ID
    async getAdminById(id) {
        try {
            const admin = await Admin.findById(id).select('-password');
            if (!admin) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            return {
                success: true,
                data: admin
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Update admin
    async updateAdmin(id, updateData) {
        try {
            // Remove sensitive fields
            delete updateData.password;
            delete updateData.employeeId;
            
            const admin = await Admin.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');
            
            if (!admin) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            
            return {
                success: true,
                message: 'User updated successfully',
                data: admin
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Delete admin
    async deleteAdmin(id) {
        try {
            const admin = await Admin.findByIdAndDelete(id);
            if (!admin) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            return {
                success: true,
                message: 'User deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new AdminService();