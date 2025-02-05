const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const friendController = require('../controllers/friendController');

// Send a friend request
router.post('/send/:userId', authMiddleware, friendController.sendFriendRequest);

// View pending friend requests
router.get('/requests', authMiddleware, friendController.viewFriendRequests);

// Accept a friend request
router.post('/accept/:userId', authMiddleware, friendController.acceptFriendRequest);

// Reject a friend request
router.post('/reject/:userId', authMiddleware, friendController.rejectFriendRequest);

// Search for users by username
router.get('/search', authMiddleware, friendController.searchUsers);

// Unfriend a user
router.delete('/unfriend/:userId', authMiddleware, friendController.unfriendUser);

module.exports = router;
