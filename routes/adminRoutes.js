const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// Approve a Mountain Owner
router.put('/approve-mountain-owner/:userId', authMiddleware, roleMiddleware(['admin']), adminController.approveMountainOwner);

// Suspend a User
router.put('/suspend-user/:userId', authMiddleware, roleMiddleware(['admin']), adminController.suspendUser);

// Unsuspend a User
router.put('/unsuspend-user/:userId', authMiddleware, roleMiddleware(['admin']), adminController.unsuspendUser);

// Delete a User
router.delete('/delete-user/:userId', authMiddleware, roleMiddleware(['admin']), adminController.deleteUser);

//delete a users post (admin)
router.delete('/:postId', authMiddleware, postController.deletePost);

// Admin action: Ignore, Delete Post, Suspend/Delete User
router.post('/action', authMiddleware, roleMiddleware(['admin']), adminController.adminActionOnReport);


module.exports = router;
