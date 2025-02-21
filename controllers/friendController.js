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
 