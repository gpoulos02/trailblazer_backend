const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Send a notification to all users (Admin-related messages)
router.post('/send/all', authMiddleware, notificationController.sendToAllUsers);

// POST: Send a direct message notification
router.post('/send/direct-message', authMiddleware, notificationController.sendDirectMessage);

// POST: Send a friend request notification
router.post('/send/friend-request', authMiddleware, notificationController.sendFriendRequestNotification);

// POST: Send a friend accept notification
router.post('/send/friend-accept', authMiddleware, notificationController.sendFriendAcceptNotification);

// POST: Send a notification to all friends of the logged-in user (Post-related notifications)
router.post('/send/friends', authMiddleware, notificationController.sendToFriends);

// DELETE: Delete a notification
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

module.exports = router;
