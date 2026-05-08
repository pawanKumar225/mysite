const express = require('express');
const router = express.Router();

// Import route files
const adminRoutes = require('./adminRoutes1');
const userRoutes = require('./userRoutes');

// Mount routes
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working! 🎉',
    endpoints: {
      admin: {
        createAdmin: 'POST /api/admin/createAdmin',
        login: 'POST /api/admin/login'
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

module.exports = router;