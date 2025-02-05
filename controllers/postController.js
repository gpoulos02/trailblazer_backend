const Post = require('../models/Post');
const Route = require('../models/Route');
const Metrics = require('../models/Metrics');
const User = require('../models/User');



///////////////////////Creating Posts//////////////////////
// Create a text post
exports.createTextPost = async (req, res) => {
    try {
        const { textContent } = req.body;
        if (!textContent) return res.status(400).json({ message: 'Text content is required' });

        const post = new Post({
            user: req.user.userId,
            type: 'text',
            textContent
        });

        await post.save();
        res.status(201).json({ message: 'Text post created', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a route post
exports.createRoutePost = async (req, res) => {
    try {
        const { routeId } = req.body;
        if (!routeId) return res.status(400).json({ message: 'Route ID is required' });

        const route = await Route.findById(routeId);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        const post = new Post({
            user: req.user.userId,
            type: 'route',
            route: route._id
        });

        await post.save();
        res.status(201).json({ message: 'Route post created', post });
    } catch (error) {
        console.error(error);
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
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.likes.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Already liked this post' });
        }

        post.likes.push(req.user.userId);
        await post.save();
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

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = {
            user: req.user.userId,
            content,
            createdAt: Date.now()
        };

        post.comments.push(comment);
        await post.save();
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
