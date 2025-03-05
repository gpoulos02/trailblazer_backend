const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');
const postController = require("../controllers/postController")

// Approve a Mountain Owner
router.put('/approve-mountain-owner/:userId', authMiddleware, roleMiddleware(['admin']), adminController.approveMountainOwner);

// Demote a Mountain Owner
router.put('/demote-mountain-owner/:userId', authMiddleware, roleMiddleware(['admin']), adminController.demoteMountainOwner);

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

//get mountain requests
router.get('/mountain-requests', authMiddleware, roleMiddleware(['admin']), adminController.getMountainRequests);

//get request by id
router.get('/mountain-requests/:id', authMiddleware, roleMiddleware(['admin']), adminController.getMountainRequestById);

//accept request
router.post('/mountain-requests/:id/accept', authMiddleware, roleMiddleware(['admin']), adminController.acceptMountainRequest);

//deny request
router.delete('/mountain-requests/:id/deny', authMiddleware, roleMiddleware(['admin']), adminController.denyMountainRequest);


module.exports = router;
