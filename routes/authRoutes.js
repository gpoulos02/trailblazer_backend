const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Import your authMiddleware

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Log in an existing user
router.post('/login', authController.login);

// GET /api/auth/profile - Fetch user profile (protected route)
router.get('/profile', authMiddleware, authController.getProfile);

router.put('/profile', authenticate, updateUserProfile);

// POST /api/auth/logout - Log out user (protected route)
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
