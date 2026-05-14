// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String, required: true },
  course: { type: String, required: true },
  semester: { type: Number, required: true },
  registrationDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
  paymentAmount: { type: Number, required: true },
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  transactionId: { type: String },
  profileImage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);