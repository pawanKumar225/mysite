const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Beauty Academy Backend API!',
    version: '1.0.0',
    endpoints: {
      admin: {
        createAdmin: 'POST /api/admin/createAdmin',
        adminLogin: 'POST /api/admin/login'
      },
      user: {
        register: 'POST /api/user/register',
        login: 'POST /api/user/login',
        updateUser: 'PUT /api/user/updateuser/:id',
        deleteUser: 'DELETE /api/user/deleteuser/:id'
      }
    }
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty_academy')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
const routes = require('./src/routes');
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

module.exports = app;