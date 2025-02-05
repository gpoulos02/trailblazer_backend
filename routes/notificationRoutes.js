const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Send a notification to all users (Admin-related messages)
router.post('/send/all', authMiddleware, notificationController.sendToAllUsers);

// POST: Send a notification to a single user (Direct messages, Friend Requests)
router.post('/send/user', authMiddleware, notificationController.sendToUser);

// POST: Send a notification to all friends of the logged-in user (Post-related notifications)
router.post('/send/friends', authMiddleware, notificationController.sendToFriends);

// DELETE: Delete a notification
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

module.exports = router;
