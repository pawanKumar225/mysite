const express = require('express');
const router = express.Router();
const {
  registerUser,
  userLogin,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById
} = require('../controllers/userController');  // Make sure this path is correct
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);     // These must be functions
router.post('/login', userLogin);           // These must be functions

// Protected routes (require authentication)
router.put('/updateuser/:id', verifyToken, updateUser);
router.delete('/deleteuser/:id', verifyToken, deleteUser);
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'User profile',
    user: req.user
  });
});

// Admin only routes
router.get('/all', verifyToken, isAdmin, getAllUsers);
router.get('/:id', verifyToken, isAdmin, getUserById);

module.exports = router;