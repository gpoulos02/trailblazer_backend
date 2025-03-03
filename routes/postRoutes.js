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
router.post('/:postID/like', authMiddleware, postController.likePost);

// Comment on a post
router.post('/:postID/comment', authMiddleware, postController.commentOnPost);

router.get('/:postID/getLikeCount', authMiddleware, postController.getLikeCount) 

// Delete a post
router.delete('/:postID', authMiddleware, postController.deletePost);

// Get all posts from the logged-in user
router.get('/my-posts', authMiddleware, postController.getMyPosts);

// Get posts from a specific user
router.get('/user/:userID', authMiddleware, postController.getUserPosts);

// Get posts from friends
router.get('/friends', authMiddleware, postController.getFriendsPosts);

module.exports = router;