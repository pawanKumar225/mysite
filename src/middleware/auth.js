// const { verifyToken } = require('../utils/jwt');

// const protect = async (req, res, next) => {
//     let token;
    
//     // Check for token in headers
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         token = req.headers.authorization.split(' ')[1];
//     }
//     // Check for token in cookies
//     else if (req.cookies && req.cookies.token) {
//         token = req.cookies.token;
//     }
    
//     if (!token) {
//         return res.status(401).json({
//             success: false,
//             message: 'Not authorized. Please login first.'
//         });
//     }
    
//     try {
//         // Verify token
//         const decoded = verifyToken(token);
        
//         if (!decoded) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid or expired token. Please login again.'
//             });
//         }
        
//         // Attach user to request
//         req.user = {
//             id: decoded.id,
//             email: decoded.email,
//             role: decoded.role
//         };
        
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             success: false,
//             message: 'Not authorized. Invalid token.'
//         });
//     }
// };

// // Role-based authorization middleware
// const authorize = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({
//                 success: false,
//                 message: `Role ${req.user.role} is not authorized to access this resource`
//             });
//         }
//         next();
//     };
// };

// const cors = require('cors');
// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true
// }));

// module.exports = { protect, authorize };


// middleware/auth.js
const { verifyToken } = require('../utils/jwt');

// Generic protect middleware (works for both admin and student)
const protect = async (req, res, next) => {
    let token;
    
    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please login first.'
        });
    }
    
    try {
        // Verify token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please login again.'
            });
        }
        
        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            type: decoded.type || 'user' // 'admin' or 'student'
        };
        
        // If it's an admin request, also fetch full admin data
        if (req.originalUrl.includes('/admin/')) {
            const Admin = require('../models/Admin');
            const admin = await Admin.findById(decoded.id);
            if (admin) {
                req.admin = admin;
            }
        }
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }
        next();
    };
};

// Admin-specific protect middleware (ensures admin exists)
const protectAdmin = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please login first.'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }
        
        // Fetch full admin data including password field
        const Admin = require('../models/Admin');
        const admin = await Admin.findById(decoded.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        req.admin = admin;
        req.user = {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            type: 'admin'
        };
        
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid token.'
        });
    }
};

module.exports = { protect, authorize, protectAdmin };