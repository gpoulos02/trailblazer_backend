const Post = require('../models/Post');
const Route = require('../models/Route');
const Metrics = require('../models/Metrics');
const User = require('../models/User');
const Report = require('../models/Report');
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

        console.log("DEBUG: Received request to create route post");
        console.log("DEBUG: Request body:", req.body);

        if (!routeID) {
            console.log("DEBUG: Missing routeID");
            return res.status(400).json({ message: 'Route ID is required' });
        }
        if (!title) {
            console.log("DEBUG: Missing title");
            return res.status(400).json({ message: 'Title is required for a post' });
        }

        // Debug the creation of the post object
        const post = new Post({
            postID: uuidv4(), // Generate postID
            userID: req.user.userID,
            type: 'route',
            routeID,
            title
        });

        console.log("DEBUG: Post object created:", post);

        // Debug the saving process before saving
        console.log("DEBUG: Attempting to save post to database...");

        await post.save();

        // Debug the success after saving
        console.log("DEBUG: Post saved successfully with ID:", post.postID);

        res.status(201).json({ message: 'Route post created successfully', post });
    } catch (error) {
        console.error("DEBUG: Server error while creating route post:", error);
        res.status(500).json({ message: 'Server error' });
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
        console.log("User making the request:", req.user.userID);
        const postID = String(req.params.postID);
        console.log("Received request to unlike post:", postID);

        // Find the post by postID
        const post = await Post.findOne({ postID: postID });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user has liked the post
        const likeIndex = post.likes.indexOf(req.user.userID);
        if (likeIndex === -1) {
            return res.status(400).json({ message: 'You have not liked this post yet' });
        }

        // Remove the user's ID from the likes array
        post.likes.splice(likeIndex, 1);

        // Update the like count
        post.likeCount = post.likes.length;

        // Save the updated post
        await post.save();

        console.log("Post unliked successfully:", post);

        // Send the updated like count to the frontend
        res.status(200).json({ message: 'Post unliked', likeCount: post.likeCount });
    } catch (error) {
        console.error("Error in unliking post:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.commentOnPost = async (req, res) => {
    try {
        const { content } = req.body;
        console.log("Received comment content:", content);

        if (!content) {
            console.log("Error: Comment content is required.");
            return res.status(400).json({ message: 'Comment content is required' });
        }

        console.log("Fetching post with postID:", req.params.postID);

        // Query the post by postID directly
        const post = await Post.findOne({ postID: req.params.postID });

        if (!post) {
            console.log("Error: Post not found with postID:", req.params.postID);
            return res.status(404).json({ message: 'Post not found' });
        }

        console.log("Post found:", post);

        // Get userID from the request user object (from the token)
        const userID = req.user.userID;
        if (!userID) {
            console.log("Error: User not found");
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("User ID from token:", userID);

        // Query the user to get the username
        const user = await User.findOne({ userID: userID });
        if (!user) {
            console.log("Error: User not found with userID:", userID);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("User found:", user);

        // Make sure all comments have the username
        post.comments = post.comments.map(comment => {
            // If username is missing in any comment, we add it
            if (!comment.username) {
                comment.username = user.username;
            }
            return comment;
        });

        // Create the new comment with the correct username and content
        const comment = {
            username: user.username,  // Attach the username to the comment
            content,
            createdAt: Date.now()
        };

        console.log("Creating comment:", comment);

        // Push the comment into the post's comments array
        post.comments.push(comment);
        console.log("New comment added to post:", post.comments);

        // Save the post with the new comment
        await post.save();
        console.log("Post saved with new comment");

        // Respond with the updated post, including the comments
        res.status(200).json({ message: 'Comment added', post: post });
    } catch (error) {
        console.error("Error in commentOnPost:", error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Delete Post
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findOne({ postID: req.params.postID });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.userID !== req.user.userID) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Post.deleteOne({ postID: req.params.postID });

        // Ensure JSON response is always sent
        return res.status(200).json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};


////////////////////////////////////Retreiving User Posts///////////////////////////////////
exports.getMyPosts = async (req, res) => {
    console.log("Made it to the getMyPosts controller");

    try {
        console.log("Made it to the try block");
        console.log("User ID from request:", req.user.userID);
        //console.log(`Fetched posts for user ${req.user.userID}:`, posts);


        const posts = await Post.find({ userID: req.user.userID })
            .sort({ createdAt: -1 })
            .lean()
            .select('postID userID type title textContent performance routeID createdAt likes comments');

        console.log(`Fetched ${posts.length} posts for user ${req.user.userID}`);

        // Manually populate the session data for each post
        const postsWithMetrics = await Promise.all(posts.map(async (post) => {
            //console.log(`Fetching session data for post ${post.postID} with sessionID ${post.sessionID}`);
            
            // Fetch the metrics data based on sessionID
            const session = await Metrics.findOne({ sessionID: post.sessionID }).select('-__v');
            
            if (session) {
                //console.log(`Session found for post ${post.postID}:`, session);
                post.sessionData = {
                    sessionID: session.sessionID,
                    runID: session.runID,
                    sessionData: session.sessionData,
                    createdAt: session.createdAt
                };
            } else {
                //console.log(`No session found for post ${post.postID} with sessionID ${post.sessionID}`);
                post.sessionData = null; // If no session found, set sessionData as null
            }
            
            return post;
        }));

        // Log the posts to verify the structure
        //console.log('Posts with metrics:', postsWithMetrics);

        res.status(200).json(postsWithMetrics);

    } catch (error) {
        console.error("Error in getMyPosts", error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Retrieve posts from all friends
// Retrieve posts from all friends
exports.getFriendsPosts = async (req, res) => {
    try {
        console.log("Received request to fetch friends' posts for user:", req.user.userID);
        
        // Fetch the user based on userID
        const user = await User.findOne({ userID: req.user.userID }).lean();
        console.log("User found:", user);

        if (!user) {
            console.log("User not found in database");
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract friend IDs
        const friendIds = user.friends;
        console.log("Friend IDs:", friendIds);

        if (!friendIds || friendIds.length === 0) {
            console.log("User has no friends, returning empty posts array");
            return res.status(200).json([]);
        }

        // Fetch posts from friends
        let posts = await Post.find({ userID: { $in: friendIds.map(String) } })
            .sort({ createdAt: -1 })  
            .lean()  
            .select('postID userID type title routeID sessionID createdAt likes comments textContent');

        console.log(`Fetched ${posts.length} posts from friends`);

        // Populate session data for performance posts
        posts = await Promise.all(posts.map(async (post) => {
            if (post.type === 'performance' && post.sessionID) {
                console.log(`Fetching session data for performance post: ${post.postID}, sessionID: ${post.sessionID}`);

                const session = await Metrics.findOne({ sessionID: post.sessionID }).select('-__v');
                
                if (session) {
                    console.log(`Session data found for sessionID ${post.sessionID}:`, session.sessionData);

                    return { 
                        ...post, 
                        sessionID: session.sessionID, 
                        topSpeed: session.sessionData?.topSpeed, 
                        distance: session.sessionData?.distance, 
                        elevationGain: session.sessionData?.elevationGain, 
                        duration: session.sessionData?.duration 
                    };
                } else {
                    console.log(`No session data found for sessionID ${post.sessionID}`);
                }
            }
            return post;
        }));

        console.log("Final friends' posts with session data:", posts);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching friends' posts:", error);
        res.status(500).json({ message: 'Server error' });
    }
};




// Retrieve posts from a specific user
exports.getAllPosts = async (req, res) => {
    console.log("Made it to the getAllPosts controller");

    try {
        // Fetch all posts for the current user
        const posts = await Post.find({ userID: req.user.userID })
            .sort({ createdAt: -1 })  // Sort posts by creation date
            .lean()  // Convert to plain JavaScript objects
            .select('postID userID type title routeID sessionID createdAt likes comments textContent');

        // Populate session data for performance posts
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            if (post.type === 'performance') {
                // Fetch session data for performance posts
                const session = await Metrics.findOne({ sessionID: post.sessionID }).select('-__v');
                
                // Flatten the session data directly into the post object
                if (session) {
                    post = { 
                        ...post, 
                        sessionID: session.sessionID, 
                        topSpeed: session.sessionData?.topSpeed, 
                        distance: session.sessionData?.distance, 
                        elevationGain: session.sessionData?.elevationGain, 
                        duration: session.sessionData?.duration 
                    };
                }
            }
            return post;
        }));

        console.log("Fetched all posts for the user:", postsWithDetails);
        res.status(200).json(postsWithDetails);  // Send the posts as the response
    } catch (error) {
        console.error("Error in getAllPosts", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Report a post
exports.reportPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const reporterId = req.user.userId;

        const post = await Post.findById(postId).populate('user', 'username');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user already reported this post
        const existingReport = await Report.findOne({ post: postId, reportedBy: reporterId });
        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this post' });
        }

        // Create new report
        const report = new Report({ post: postId, reportedBy: reporterId, reason });

        await report.save();

        res.status(200).json({ message: 'Post reported successfully', report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



