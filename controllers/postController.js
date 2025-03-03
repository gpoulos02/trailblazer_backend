const Post = require('../models/Post');
const Route = require('../models/Route');
const Metrics = require('../models/Metrics');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationUtils');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');




///////////////////////Creating Posts//////////////////////
// Create a text post
// Creating Text Post
exports.createTextPost = async (req, res) => {
    try {
        const { title, textContent } = req.body;
        if (!textContent) return res.status(400).json({ message: 'Text content is required' });
        if (!title) return res.status(400).json({ message: 'Title is required for a post' });

        const post = new Post({
            postID: uuidv4(), // Generate postID
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

// Creating Route Post
exports.createRoutePost = async (req, res) => {
    try {
        const { routeID, title } = req.body;


        // Log the received body
        console.log("Received request body:", req.body);

        // Log routeID to check if it is properly received
        console.log('Creating route post with routeID:', routeID);

        // Validate request body

        if (!routeID) {
            return res.status(400).json({ message: 'Route ID is required' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Title is required for a post' });
        }

const post = new Post({
    postID: uuidv4(), // Generate postID
    userID: req.user.userID,
    type: 'route',
    routeID: String(routeID), // Forcefully set routeID to String
    title: title
});

// Log the full post data before saving
console.log('Post data:', post);

try {
    // Ensure the user is authenticated
    if (!req.user || !req.user.userID) {
        return res.status(401).json({ message: 'Unauthorized: User ID is missing' });
    }

    // Save the post
    await post.save();

    res.status(201).json({ message: 'Route post created successfully', post });
} catch (error) {
    console.error('Error creating route post:', error);
    res.status(500).json({ message: 'Error creating route post', error: error.message });
}
};

// Creating Performance Post
exports.createPerformancePost = async (req, res) => {
    try {
        const { sessionID, title } = req.body;

        if (!sessionID) return res.status(400).json({ message: 'Session ID is required' });

        const session = await Metrics.findOne({ sessionID: sessionID });
        if (!session) return res.status(404).json({ message: 'Session data not found' });

        const post = new Post({
            postID: uuidv4(), // Generate postID
            userID: req.user.userID,
            type: 'performance',
            sessionID,
            title
        });

        await post.save();
        res.status(201).json({ message: 'Performance post created', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Liking a Post
exports.likePost = async (req, res) => {
    try {
        console.log("User making the request:", req.user.userID);
        const postID = String(req.params.postID);
        console.log("Received request to like post:", postID);

        // Find the post by postID
        const post = await Post.findOne({ postID: postID });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user has already liked the post
        if (post.likes.includes(req.user.userID)) {
            return res.status(400).json({ message: 'Already liked this post' });
        }

        // Add the user's ID to the likes array
        post.likes.push(req.user.userID);

        // Update the like count
        post.likeCount = post.likes.length;

        // Save the updated post
        await post.save();

        console.log("Post liked successfully:", post);

        // Send the updated like count to the frontend
        res.status(200).json({ message: 'Post liked', likeCount: post.likeCount });
    } catch (error) {
        console.error("Error in liking post:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getLikeCount = async (req, res) => {
    try {
        const postID = String(req.params.postID);
    
        console.log('Fetching like count for postId:', postID);  // Debugging line
    
        // Find the post by ID
        const post = await Post.findOne({ postID: postID });
    
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
    
        // Return the like count
        const likeCount = post.likes.length;
        console.log('Like count for postId:', postID, 'is:', likeCount);  // Debugging line
    
        res.json({ likeCount });
    
      } catch (error) {
        console.error('Error fetching like count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
};




// Unliking a Post
exports.unlikePost = async (req, res) => {
    try {
        const post = await Post.findOne({ postID: req.params.postID });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const likeIndex = post.likes.indexOf(req.user.userID);
        if (likeIndex === -1) {
            return res.status(400).json({ message: 'You have not liked this post' });
        }

        post.likes.splice(likeIndex, 1);
        await post.save();

        res.status(200).json({ message: 'Post unliked', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Comment on Post
exports.commentOnPost = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Comment content is required' });

        const post = await Post.findOne({ postID: req.params.postID }).populate('userID', 'username');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = {
            user: req.user.userID,
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

// Delete Post
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findOne({ postID: req.params.postID });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.userID !== req.user.userID) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Post.deleteOne({ postID: req.params.postID });
        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

////////////////////////////////////Retreiving User Posts///////////////////////////////////
exports.getMyPosts = async (req, res) => {
    console.log("Made it to the getMyPosts controller");

    try {
        console.log("Made it to the try block");
        console.log("User ID from request:", req.user.userID);

        const posts = await Post.find({ userID: req.user.userID })
            .sort({ createdAt: -1 })
            .lean()
            .populate({
                path: 'user',
                match: { userID: req.user.userID },  // Use userID for matching
                select: 'username',
                options: { strictPopulate: false },
            })
            .populate({
                path: 'sessionID',  // Populate sessionID with custom UUID string
                model: 'Metrics',  // Metrics model for performance data
                foreignField: 'sessionID',  // Explicitly match `sessionID`
                localField: 'sessionID'  // Match using sessionID UUID as string
            })
            .select('postID userID type title textContent performance route createdAt likes comments');

        // Log the posts to verify the structure
        console.log('Posts fetched:', posts);

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in getMyPosts", error);
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


