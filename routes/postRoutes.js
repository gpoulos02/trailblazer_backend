const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create a text post
router.post('/text', authMiddleware, postController.createTextPost);

// Create a route post
router.post('/route', authMiddleware, postController.createRoutePost);

// Create a performance post
router.post('/performance', authMiddleware, postController.createPerformancePost);

// Like a post
router.post('/:postID/like', authMiddleware, postController.likePost);

//Unlike a post 
router.post('/:postID/unlike', authMiddleware, postController.unlikePost);

// Comment on a post
router.post('/:postID/comment', authMiddleware, postController.commentOnPost);

router.get('/:postID/getLikeCount', authMiddleware, postController.getLikeCount) 

// Delete a post
router.delete('/delete/:postID', authMiddleware, postController.deletePost);

// Get all posts from the logged-in user
router.get('/my-posts', authMiddleware, postController.getMyPosts);

// Get posts from a specific user
router.get('/posts', authMiddleware, postController.getAllPosts);

// Get posts from friends
router.get('/friends', authMiddleware, postController.getFriendsPosts);

// Report a post
router.post('/report/:postId', authMiddleware, postController.reportPost);

//get all posts for admin to view
router.get('/getEveryPost', authMiddleware, roleMiddleware(['admin']), postController.getAllPostsInDatabase);

module.exports = router;