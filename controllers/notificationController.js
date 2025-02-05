const Notification = require('../models/Notification');
const User = require('../models/User'); // To fetch users for sending notifications

// Send a notification to all users (Admin-related messages)
exports.sendToAllUsers = async (req, res) => {
    try {
        const { type, message } = req.body;

        if (!type || !message) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const users = await User.find({}, '_id'); // Fetch all user IDs

        const notifications = users.map(user => ({
            user: user._id,
            type,
            message,
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({ message: "Notification sent to all users successfully" });
    } catch (error) {
        console.error('Error sending notification to all users:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a notification to a single user (Direct messages, Friend Requests)
exports.sendToUser = async (req, res) => {
    try {
        const { userId, type, message } = req.body;

        if (!userId || !type || !message) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const notification = new Notification({
            user: userId,
            type,
            message,
        });

        await notification.save();
        res.status(201).json({ message: "Notification sent successfully", notification });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Send a notification to all friends of the logged-in user (Post-related notifications)
exports.sendToFriends = async (req, res) => {
    try {
        const { type, message } = req.body;
        const userId = req.user.userId; // Get logged-in user's ID

        if (!type || !message) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const user = await User.findById(userId).populate('friends', '_id');

        if (!user || !user.friends.length) {
            return res.status(404).json({ message: "No friends found to notify" });
        }

        const notifications = user.friends.map(friend => ({
            user: friend._id,
            type,
            message,
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({ message: "Notification sent to all friends successfully" });
    } catch (error) {
        console.error('Error sending notification to friends:', error);
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

