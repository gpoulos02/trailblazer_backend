const Post = require('../models/Post');
const Route = require('../models/Route');
const Metrics = require('../models/Metrics');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationUtils');
const mongoose = require('mongoose'); 



///////////////////////Creating Posts//////////////////////
// Create a text post
exports.createTextPost = async (req, res) => {
    try {
        const { title, textContent } = req.body;
        if (!textContent) return res.status(400).json({ message: 'Text content is required' });
        if (!title) return res.status(400).json({ message: 'Title is required for a post' });

        console.log("made it to the text post controller");
        console.log('Creating text post:', textContent);

        const post = new Post({
            user: req.user.userID,
            type: 'text',
            title,
            textContent
        });

        await post.save();
        res.status(201).json({ message: 'Text post created', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createRoutePost = async (req, res) => {
    try {
        const { routeId, title } = req.body;

        console.log("made it to the post controller");
        console.log('Creating route post:', routeId, title);

        // Validate request body
        if (!routeId) {
            return res.status(400).json({ message: 'Route ID is required' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Title is required for a post' });
        }
        // if (!mongoose.Types.ObjectId.isValid(routeId)) {
        //     return res.status(400).json({ message: 'Invalid Route ID' });
        // }

        // Fetch route
        // const route = await Route.findOne({ routeID: routeId });        
        // if (!route) {
        //     return res.status(404).json({ message: 'Route not found' });
        // }

        // Ensure user is authenticated and has a valid userID (UUID as String)
        if (!req.user || !req.user.userID) {
            return res.status(401).json({ message: 'Unauthorized: User ID is missing' });
        }

        // Create post
        const post = new Post({
            user: req.user.userID, // Store userID as a String
            type: 'route',
            route: routeId,
            title: title, // Include title in the post
        });

        await post.save();

        res.status(201).json({ message: 'Route post created successfully', post });
    } catch (error) {
        console.error('Error creating route post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a performance post
exports.createPerformancePost = async (req, res) => {
    try {
        const { performanceId } = req.body;
        if (!performanceId) return res.status(400).json({ message: 'Performance ID is required' });

        const performance = await Metrics.findById(performanceId);
        if (!performance) return res.status(404).json({ message: 'Performance data not found' });

        const post = new Post({
            user: req.user.userId,
            type: 'performance',
            performance: performance._id
        });

        await post.save();
        res.status(201).json({ message: 'Performance post created', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//////////////////////////Interacting with Posts//////////////////////////////

// Like a post 
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('user', 'username');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.likes.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Already liked this post' });
        }

        post.likes.push(req.user.userId);
        await post.save();

        // 🚀 **Trigger Post Like Notification**
        await sendNotification(post.user._id, 'post_like', req.user.username);

        res.status(200).json({ message: 'Post liked', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Comment on a post 
exports.commentOnPost = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Comment content is required' });

        const post = await Post.findById(req.params.postId).populate('user', 'username');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = {
            user: req.user.userId,
            content,
            createdAt: Date.now()
        };

        post.comments.push(comment);
        await post.save();

        // 🚀 **Trigger Comment Notification**
        await sendNotification(post.user._id, 'comment', req.user.username);

        res.status(200).json({ message: 'Comment added', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/////////////////////////////// Delete a post//////////////////


exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Ensure the user owns the post
        if (post.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

////////////////////////////////////Retreiving User Posts///////////////////////////////////

// Retrieve all posts from the logged-in user
exports.getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user.userId })
            .sort({ createdAt: -1 }) // Newest posts first
            .populate('user', 'username') // Populate user info
            .populate('route') // Populate route details if any
            .populate('performance'); // Populate performance details if any

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Retrieve posts from a specific user
exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('user', 'username')
            .populate('route')
            .populate('performance');

        if (!posts.length) return res.status(404).json({ message: 'No posts found for this user' });

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Retrieve posts from all friends
exports.getFriendsPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('friends');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const friendIds = user.friends.map(friend => friend._id);

        const posts = await Post.find({ user: { $in: friendIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'username')
            .populate('route')
            .populate('performance');

        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
