const adminService = require('../services/adminService');

// class AdminController {
    
//     // ✅ LOGIN ADMIN - Clean working function
//     async loginAdmin(req, res) {
//         try {
//             const { email, password } = req.body;
            
//             // Call service to handle login logic
//             const result = await adminService.loginAdmin(email, password, req);
            
//             if (result.success) {
//                 // Set cookie if needed
//                 if (result.cookieOptions) {
//                     res.cookie('token', result.data.token, result.cookieOptions);
//                 }
                
//                 // Return success response with token
//                 return res.status(200).json({
//                     success: true,
//                     message: result.message,
//                     data: result.data
//                 });
//             } else {
//                 // Return error response
//                 return res.status(401).json({
//                     success: false,
//                     message: result.message,
//                     error: result.error
//                 });
//             }
            
//         } catch (error) {
//             console.error('Login controller error:', error);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Internal server error',
//                 error: error.message
//             });
//         }
//     }

//     // Create Admin
//     async createAdmin(req, res) {
//         const { name, email, password } = req.body;
        
//         if (!name || !email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Name, email and password are required'
//             });
//         }

//         const result = await adminService.createAdmin({ name, email, password });
        
//         if (result.success) {
//             res.status(201).json(result);
//         } else {
//             res.status(400).json(result);
//         }
//     }

//     // Get All Admins
//     async getAllAdmins(req, res) {
//         const result = await adminService.getAllAdmins();
        
//         if (result.success) {
//             res.status(200).json(result);
//         } else {
//             res.status(500).json(result);
//         }
//     }

//     // Get Current Admin Profile
//     async getCurrentAdmin(req, res) {
//         const adminId = req.user?.id; // From auth middleware
//         const result = await adminService.getCurrentAdmin(adminId);
        
//         if (result.success) {
//             res.status(200).json(result);
//         } else {
//             res.status(404).json(result);
//         }
//     }

//     // Logout Admin
//     async logoutAdmin(req, res) {
//         const result = await adminService.logoutAdmin();
        
//         // Clear cookie
//         res.clearCookie('token');
        
//         res.status(200).json(result);
//     }
// }

class AdminController {
    // ✅ LOGIN ADMIN - Clean working function
    async loginAdmin(req, res) {
        try {
            const { email, password } = req.body;
            
            // Call service to handle login logic
            const result = await adminService.loginAdmin(email, password, req);
            
            if (result.success) {
                // Set cookie if needed
                if (result.cookieOptions) {
                    res.cookie('token', result.data.token, result.cookieOptions);
                }
                
                // Return success response with token
                return res.status(200).json({
                    success: true,
                    message: result.message,
                    data: result.data
                });
            } else {
                // Return error response
                return res.status(401).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }
            
        } catch (error) {
            console.error('Login controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    // Create new admin
    async createAdmin(req, res) {
        try {
            const { name, email, role } = req.body;
            
            // Validate required fields
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and email are required'
                });
            }
            
            const result = await adminService.createAdmin({
                name,
                email,
                role: role || 'Employee'
            });
            
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    data: result.data,
                    emailSent: result.emailSent
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
            
        } catch (error) {
            console.error('Create admin controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    
    // Get all admins
    async getAllAdmins(req, res) {
        const result = await adminService.getAllAdmins();
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    }
    
    // Get admin by ID
    async getAdminById(req, res) {
        const result = await adminService.getAdminById(req.params.id);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    }
    
    // Update admin
    async updateAdmin(req, res) {
        const result = await adminService.updateAdmin(req.params.id, req.body);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    }
    
    // Delete admin
    async deleteAdmin(req, res) {
        const result = await adminService.deleteAdmin(req.params.id);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(404).json(result);
        }
    }
}

module.exports = new AdminController();