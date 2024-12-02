const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Log in an existing user
router.post('/login', authController.login);

router.post('/logout', authController.logout);

//doesn't work idk why 
router.get('/user/:userID', authController.getUserFullName);


module.exports = router;
