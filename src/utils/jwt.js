const jwt = require('jsonwebtoken');

// JWT Secret (store in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
const generateToken = (adminId, email, role) => {
    return jwt.sign(
        { 
            id: adminId, 
            email: email,
            role: role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
};

// Verify JWT Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
};