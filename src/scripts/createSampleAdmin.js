const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const sampleAdmins = [
    {
        name: 'Rama',
        email: 'rama123@Gmail.com',
        password: 'password123',
        role: 'super_admin',
        isActive: true
    }
];

async function createSampleAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_db');
        console.log('Connected to MongoDB');

        for (const adminData of sampleAdmins) {
            const existingAdmin = await Admin.findOne({ email: adminData.email });
            if (!existingAdmin) {
                const admin = new Admin(adminData);
                await admin.save();
                console.log(`Created admin: ${adminData.name} (${adminData.email})`);
            } else {
                console.log(`Admin with email ${adminData.email} already exists`);
            }
        }

        console.log('Sample admin creation completed');
        process.exit(0);
    } catch (error) {
        console.error('Error creating sample admins:', error);
        process.exit(1);
    }
}

createSampleAdmins();