const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

// IMPORTANT: Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: MongoDB Connection for Mongoose v6+ (no deprecated options)
mongoose.connect('mongodb://localhost:27017/admin_db')
.then(() => console.log('✅ MongoDB Connected successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Admin Schema
const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        default: 'admin'
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
    }
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
    console.log('🔄 Pre-save middleware triggered');
    
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hash');
        return next();
    }
    
    try {
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('✅ Password hashed successfully');
        next();
    } catch (error) {
        console.error('❌ Error hashing password:', error);
        next(error);
    }
});

// Create model
const Admin = mongoose.model('Admin', adminSchema);

// CREATE ADMIN API
app.post('/api/admins', async (req, res) => {
    try {
        console.log('📥 Received body:', req.body);
        
        const { name, email, password, role, isActive, createdAt } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }
        
        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }
        
        // Prepare admin data
        const adminData = {
            name,
            email,
            password,
            role: role || 'admin',
            isActive: isActive !== undefined ? isActive : true
        };
        
        // Add createdAt only if provided
        if (createdAt) {
            adminData.createdAt = new Date(createdAt);
        }
        
        // Create and save admin
        const admin = new Admin(adminData);
        await admin.save();
        
        // Return response without password
        const adminResponse = admin.toObject();
        delete adminResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: adminResponse
        });
        
    } catch (error) {
        console.error('❌ Error in POST /api/admins:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: error.message
        });
    }
});

// GET ALL ADMINS
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });
    } catch (error) {
        console.error('❌ Error in GET /api/admins:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: error.message
        });
    }
});

// GET SINGLE ADMIN
app.get('/api/admins/:id', async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('❌ Error in GET /api/admins/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: error.message
        });
    }
});

// UPDATE ADMIN
app.put('/api/admins/:id', async (req, res) => {
    try {
        // Remove password from update if present
        if (req.body.password) {
            delete req.body.password;
        }
        
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Admin updated successfully',
            data: admin
        });
    } catch (error) {
        console.error('❌ Error in PUT /api/admins/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: error.message
        });
    }
});

// DELETE ADMIN
app.delete('/api/admins/:id', async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error in DELETE /api/admins/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: error.message
        });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/admins`);
});