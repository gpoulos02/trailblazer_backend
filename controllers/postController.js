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
            userID: req.user.userID,
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
        const { routeID, title } = req.body;

        console.log("made it to the post controller");
        console.log('Creating route post:', routeID, title);

        // Validate request body
        if (!routeID) {
            return res.status(400).json({ message: 'Route ID is required' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Title is required for a post' });
        }
        
        if (!req.user || !req.user.userID) {
            return res.status(401).json({ message: 'Unauthorized: User ID is missing' });
        }

        // Create post
        const post = new Post({
            userID: req.user.userID, // Store userID as a String
            type: 'route',
            route: routeID,
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
        const { sessionID, title } = req.body; // Get sessionID and title from the request body

        console.log('Session ID:', sessionID);

        if (!sessionID) return res.status(400).json({ message: 'Session ID is required' });

        // Search for the session using the sessionID field (not Mongo's default _id)
        const session = await Metrics.findOne({ sessionID: sessionID });
        if (!session) return res.status(404).json({ message: 'Session data not found' });

        // Create a new post using the found session data
        const post = new Post({
            userID: req.user.userID, // Assuming req.user contains user information
            type: 'performance',
            sessionID: sessionID, // Store the sessionID to link the performance post
            title: title // Use the title provided from the front-end
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
exports.getMyPosts = async (req, res) => {
    console.log("made it to the get my posts controller");
    try {
        console.log("made it to the try block");

        const posts = await Post.find({ userID: req.user.userID })
            .sort({ createdAt: -1 })
            .lean()
            .populate({
                path: 'user',
                match: { userID: req.user.userID },  // Use userID for matching
                select: 'username',
                options: { strictPopulate: false },
            })
            .populate('routeID')  // Populate the route
            .populate({
                path: 'sessionID',  // Populate sessionID with custom UUID string
                model: 'Metrics',  // Metrics model for performance data
                foreignField: 'sessionID',  // Explicitly match `sessionID`
                localField: 'sessionID'  // Match using sessionID UUID as string
            });

        res.status(200).json(posts);
    } catch (error) {
        console.log(req.user.userID);
        console.error("error in getMyPosts", error);
        res.status(500).json({ message: 'Server error' });
    }
};





// Retrieve posts from all friends
// Retrieve posts from all friends
exports.getFriendsPosts = async (req, res) => {
        try {
            const user = await User.findOne({ userID: req.user.userID }).lean(); // Use lean() to return a plain object
    
            if (!user) return res.status(404).json({ message: 'User not found' });
    
            const friendIds = user.friends; // No need for populate
            console.log("Friend IDs:", friendIds);
    
            const posts = await Post.find({ userID: { $in: friendIds.map(String) } }) // Ensure they are strings
                .sort({ createdAt: -1 })
                .populate('routeID')
                .populate('sessionID');
    
            res.status(200).json(posts);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    };
    
    





// Retrieve posts from a specific user
exports.getUserPosts = async (req, res) => {
    try {
        const { userID } = req.params;
        const posts = await Post.find({ user: userID })
            .sort({ createdAt: -1 })
            .populate('user', 'u