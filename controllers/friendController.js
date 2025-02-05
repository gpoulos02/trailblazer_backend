const User = require('../models/User');
const Fuse = require('fuse.js');


// View Friend Requests
exports.viewFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('friendRequestsReceived', 'username firstName lastName');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ friendRequests: user.friendRequestsReceived });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Send a Friend Request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user.userId;

        if (senderId === userId) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(userId);

        if (!receiver) {
            return res.status(404).json({ message: "User not found." });
        }

        if (sender.friends.includes(userId) || receiver.friends.includes(senderId)) {
            return res.status(400).json({ message: "You are already friends." });
        }

        if (receiver.friendRequestsReceived.includes(senderId)) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        // Update both users' friend request lists
        sender.friendRequestsSent.push(userId);
        receiver.friendRequestsReceived.push(senderId);

        await sender.save();
        await receiver.save();

        res.status(200).json({ message: "Friend request sent." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Accept a Friend Request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const receiverId = req.user.userId;

        const receiver = await User.findById(receiverId);
        const sender = await User.findById(userId);

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!receiver.friendRequestsReceived.includes(userId)) {
            return res.status(400).json({ message: "No friend request found from this user." });
        }

        // Add each other as friends
        receiver.friends.push(userId);
        sender.friends.push(receiverId);

        // Remove friend request
        receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => id.toString() !== userId);
        sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id.toString() !== receiverId);

        await receiver.save();
        await sender.save();

        res.status(200).json({ message: "Friend request accepted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Reject a Friend Request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const receiverId = req.user.userId;

        const receiver = await User.findById(receiverId);
        const sender = await User.findById(userId);

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!receiver.friendRequestsReceived.includes(userId)) {
            return res.status(400).json({ message: "No friend request found from this user." });
        }

        // Remove friend request
        receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => id.toString() !== userId);
        sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id.toString() !== receiverId);

        await receiver.save();
        await sender.save();

        res.status(200).json({ message: "Friend request rejected." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Unfriend a User
exports.unfriendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(userId);

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if they are friends
        if (!currentUser.friends.includes(userId)) {
            return res.status(400).json({ message: "You are not friends with this user." });
        }

        // Remove from each other's friend lists
        currentUser.friends = currentUser.friends.filter(id => id.toString() !== userId);
        otherUser.friends = otherUser.friends.filter(id => id.toString() !== currentUserId);

        await currentUser.save();
        await otherUser.save();

        res.status(200).json({ message: "User has been unfriended." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Search Users with Fuzzy Matching
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Search query is required." });
        }

        // Fetch all users (ideally, this should be optimized with caching in a real-world app)
        const users = await User.find().select("username firstName lastName _id");

        // Set up Fuse.js for fuzzy search
        const fuse = new Fuse(users, {
            keys: ["username", "firstName", "lastName"], // Fields to search in
            threshold: 0.3,  // Adjust how "fuzzy" it is (0 = exact match, 1 = very loose)
            includeScore: true, // Include similarity scores
        });

        const results = fuse.search(query);

        // Extract matched users
        const matchedUsers = results.map(result => result.item);

        res.status(200).json(matchedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};