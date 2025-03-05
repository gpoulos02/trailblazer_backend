const User = require('../models/User');
const Fuse = require('fuse.js');
const { sendNotification } = require('../utils/notificationUtils');

// View Friend Requests
exports.viewFriendRequests = async (req, res) => {
    try {
        const user = await User.findOne({ userID: req.user.userID });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch usernames based on user IDs in friendRequestsReceived
        const users = await User.find({
            userID: { $in: user.friendRequestsReceived }
        });

        const friendRequests = users.map(user => ({
            userID: user.userID,
            username: user.username
        }));

        console.log("Friend Requests:", friendRequests);

        res.status(200).json({ friendRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Send a Friend Request
exports.sendFriendRequest = async (req, res) => {
    try {
        const { userID } = req.params;
        const senderID = req.user.userID;

        if (senderID === userID) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        const sender = await User.findOne({ userID: senderID });
        const receiver = await User.findOne({ userID: userID });

        if (!receiver) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!sender){
            return res.status(404).json({message: "Sender not found."});
        }

        if (sender.friends.includes(userID) || receiver.friends.includes(senderID)) {
            return res.status(400).json({ message: "You are already friends." });
        }

        if (receiver.friendRequestsReceived.includes(senderID)) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        sender.friendRequestsSent.push(userID);
        receiver.friendRequestsReceived.push(senderID);
        await sender.save();
        await receiver.save();

        // await sendNotification(userID, 'friend_request', sender.username);

        res.status(200).json({ message: "Friend request sent." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Accept a Friend Request
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { userID } = req.params;
        const receiverID = req.user.userID;

        const receiver = await User.findOne({ userID: receiverID });
        const sender = await User.findOne({ userID: userID });

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!receiver.friendRequestsReceived.includes(userID)) {
            return res.status(400).json({ message: "No friend request found from this user." });
        }

        receiver.friends.push(userID);
        sender.friends.push(receiverID);

        receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => id !== userID);
        sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id !== receiverID);

        await receiver.save();
        await sender.save();

        await sendNotification(userID, 'friend_accept', receiver.username);

        res.status(200).json({ message: "Friend request accepted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Reject a Friend Request
exports.rejectFriendRequest = async (req, res) => {
    try {
        const { userID } = req.params;
        const receiverID = req.user.userID;

        const receiver = await User.findOne(receiverID);
        const sender = await User.findOne(userID);

        if (!receiver || !sender) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!receiver.friendRequestsReceived.includes(userID)) {
            return res.status(400).json({ message: "No friend request found from this user." });
        }

        receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => id !== userID);
        sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id !== receiverID);
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
        const { userID } = req.params;
        const currentUserID = req.user.userID;

        console.log("Entered unfriendUser");
        console.log("Current user ID:", currentUserID);
        console.log("User ID to unfriend:", userID);

        const currentUser = await User.findOne({ userID: currentUserID });
        const otherUser = await User.findOne({ userID: userID });

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!currentUser.friends.includes(userID)) {
            return res.status(400).json({ message: "You are not friends with this user." });
        }

        // Remove the userID from the currentUser's friends list
        currentUser.friends = currentUser.friends.filter(friendID => friendID !== userID);

        // Remove currentUser's userID from the otherUser's friends list
        otherUser.friends = otherUser.friends.filter(friendID => friendID !== currentUserID);

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
        
        console.log("Entered try block");
        console.log("Received search query:", query);
        
        if (!query) {
            console.log("Query missing, sending 400 response");
            return res.status(400).json({ message: "Search query is required." });
        }

        const users = await User.find().select("username firstName lastName _id");

        console.log("Fetched users from DB:", users.length);

        const fuse = new Fuse(users, {
            keys: ["username", "firstName", "lastName"],
            threshold: 0.3,
            includeScore: true,
        });

        const results = fuse.search(query);
        const matchedUsers = results.map(result => result.item);

        console.log("Search results:", matchedUsers.length);

        res.status(200).json(matchedUsers);
    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ message: "Server error.", error: error.toString() });
    }
};

exports.getUserIDFromUsername = async (req, res) => {
    try {
        const { username } = req.query;

        console.log("Entered try block and username is:", username);

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ userID: user.userID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// Get username by userID
exports.getUsernameFromUserID = async (req, res) => {
    try {
        const { userID } = req.query;

        const user = await User.findOne({ userID });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error." });
    }
};

// View Friends (this is a new API endpoint)
exports.viewFriends = async (req, res) => {
    try {

        console.log("Entered viewFriends");
        const user = await User.findOne({ userID: req.user.userID });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch usernames based on user IDs in friends array
        const users = await User.find({
            userID: { $in: user.friends }
        });

        

        const friends = users.map(user => ({
            userID: user.userID,
            username: user.username
        }));

        console.log("Friends:", friends);

        res.status(200).json({ friends });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Checking Pending Friend Requests
exports.checkPendingRequests = async (req, res) => {
    try {
        const userId = req.user.userID;  // Get the userID from the JWT token
        console.log("Checking pending requests for user:", userId);

        // Find the user by their userID (stored as a string)
        const user = await User.findOne({ userID: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the count of pending friend requests
        const pendingRequestsCount = user.friendRequestsReceived.length;

        if (pendingRequestsCount === 0) {
            return res.status(200).json({ pendingRequestsCount: 0 });  // No pending requests
        }

        // If there are pending requests, get all users who sent the requests
        const usersWithPendingRequests = await User.find({
            userID: { $in: user.friendRequestsReceived }
        });

        // Prepare the data to send back
        const pendingRequests = usersWithPendingRequests.map(user => ({
            userID: user.userID,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
        }));

        // Return the count of pending requests (limit it to 9 if greater than 9)
        const response = {
            pendingRequestsCount: pendingRequestsCount > 9 ? 9 : pendingRequestsCount,
            pendingRequests: pendingRequests  // List of pending requests
        };

        console.log("Pending requests:", pendingRequests);

        // Send back the count and the list of users with pending friend requests
        res.status(200).json(response);
    } catch (error) {
        console.error("Error checking pending friend requests:", error);
        res.status(500).json({ message: 'Server error' });
    }
};



