const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true,
        sparse: true
    },
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
    }
});

// Generate employee ID before saving
adminSchema.pre('save', async function(next) {
    // Generate employee ID only for new documents and only for employees
    if (this.isNew && !this.employeeId) {
        const prefix = 'IBA';
        const currentYear = new Date().getFullYear();
        
        // Find the last employee ID
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

// Hash password before saving
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

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);