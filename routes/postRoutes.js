const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// Create a text post
router.post('/text', authMiddleware, postController.createTextPost);

// Create a route post
router.post('/route', authMiddleware, postController.createRoutePost);

// Create a performance post
router.post('/performance', authMiddleware, postController.createPerformancePost);

// Like a post
router.post('/:postId/like', authMiddleware, postController.likePost);

// Comment on a post
router.post('/:postId/comment', authMiddleware, postController.commentOnPost);

// Delete a post
router.delete('/:postId', authMiddleware, postController.deletePost);

// Get all posts from the logged-in user
router.get('/my-posts', authMiddleware, postController.getMyPosts);

// Get posts from a specific user
router.get('/user/:userId', authMiddleware, postController.getUserPosts);

// Get posts from friends
router.get('/friends', authMiddleware, postController.getFriendsPosts);

module.exports = router;