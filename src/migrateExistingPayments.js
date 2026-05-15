// migrate-existing-payments.js
// Run this script once to create payment records for existing students

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intense';

// Define schemas (simplified for migration)
const userSchema = new mongoose.Schema({}, { strict: false });
const paymentSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema, 'users');
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

async function migrateExistingPayments() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all students with paymentAmount > 0 but no payment record
        const students = await User.find({ 
            paymentAmount: { $gt: 0 },
            registrationId: { $exists: true }
        });

        console.log(`📊 Found ${students.length} students with payment data\n`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            // Check if payment record already exists
            const existingPayment = await Payment.findOne({ studentId: student._id });
            
            if (!existingPayment && student.paymentAmount > 0) {
                const payment = new Payment({
                    studentId: student._id,
                    studentName: student.name,
                    registrationId: student.registrationId,
                    amount: student.paymentAmount,
                    paymentDate: student.paymentDate || student.createdAt || new Date(),
                    status: student.paymentStatus || 'pending',
                    paymentMethod: student.paymentMethod || 'Cash',
                    transactionId: student.transactionId || `MIG-${student.registrationId}`,
                    remarks: 'Migrated from existing student data'
                });
                
                await payment.save();
                createdCount++;
                console.log(`✅ Created payment record for: ${student.name} (${student.registrationId}) - Amount: ₹${student.paymentAmount}`);
            } else if (existingPayment) {
                skippedCount++;
                console.log(`⏭️ Skipped - Payment already exists for: ${student.name}`);
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Created: ${createdCount} payment records`);
        console.log(`   ⏭️ Skipped: ${skippedCount} (already exist)`);
        console.log(`   📊 Total processed: ${students.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

migrateExistingPayments();