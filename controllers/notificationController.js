const Notification = require('../models/Notification');
const User = require('../models/User'); // To fetch users for sending notifications

// Send a notification to all users (Admin messages)
exports.sendToAllUsers = async (req, res) => {
    try {
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).json({ message: "Title and body are required." });
        }

        const users = await User.find({}, '_id');

        for (const user of users) {
            await sendNotification(user._id, 'system_alert', '', title, body);
        }

        res.status(201).json({ message: "Notification sent to all users successfully" });
    } catch (error) {
        console.error('Error sending notification to all users:', error);
        res.status(500).json({ message: "Server error" });
    }
};

//Send Direct Message
exports.sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, title, body } = req.body;
        const senderId = req.user.userId;

        if (!recipientId || !title || !body) {
            return res.status(400).json({ message: "Recipient, title, and body are required." });
        }

        await sendNotification(recipientId, 'direct_message', '', title, body);

        res.status(201).json({ message: "Direct message notification sent!" });
    } catch (error) {
        console.error("Error sending direct message:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Send a friend request notification
exports.sendFriendRequestNotification = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.userId;

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ message: "User not found." });
        }

        await sendNotification(recipientId, 'friend_request', sender.username);

        res.status(201).json({ message: "Friend request notification sent!" });
    } catch (error) {
        console.error("Error sending friend request notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Send a friend accept notification
exports.sendFriendAcceptNotification = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.userId;

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ message: "User not found." });
        }

        await sendNotification(recipientId, 'friend_accept', sender.username);

        res.status(201).json({ message: "Friend accept notification sent!" });
    } catch (error) {
        console.error("Error sending friend accept notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: "Server error" });
    }
};

