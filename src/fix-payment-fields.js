// fix-payment-fields.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/intense';

async function fixPaymentFields() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Fix users with null paymentMethod
        const result = await usersCollection.updateMany(
            { paymentMethod: null },
            {
                $set: {
                    paymentMethod: null,
                    paymentStatus: 'pending',
                    paymentDate: null,
                    transactionId: null,
                    paymentAmount: 0
                }
            }
        );

        console.log(`✅ Fixed ${result.modifiedCount} users`);
        console.log(`✅ Migration completed!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixPaymentFields();