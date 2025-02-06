const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const { sendNotification } = require('../utils/notificationUtils');

// Approve a Mountain Owner 
exports.approveMountainOwner = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = 'mountain_owner';
        await user.save();

        // Send approval email
        await sendEmail(
            user.email,
            'Mountain Owner Approval',
            `Hello ${user.firstName},\n\nCongratulations! You have been approved as a Mountain Owner. You now have access to additional features within the TrailBlazer app.\n\nRegards,\nTrailBlazer Team`
        );

        // Send in-app notification
        await sendNotification(
            user._id,
            'system_alert',
            '',
            'Mountain Owner Approval',
            'You have been approved as a Mountain Owner!'
        );

        res.json({ message: 'User promoted to Mountain Owner and notified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Suspend a User 
exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.suspended) {
            return res.status(400).json({ message: 'User is already suspended' });
        }

        user.suspended = true;
        await user.save();

        // Send suspension email
        await sendEmail(
            user.email,
            'Account Suspended',
            `Hello ${user.firstName},\n\nYour account has been suspended by the admin. If you believe this was a mistake, please contact support.\n\nRegards,\nTrailBlazer Team`
        );

        res.json({ message: 'User suspended and notified via email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unsuspend a User 
exports.unsuspendUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.suspended) {
            return res.status(400).json({ message: 'User is not suspended' });
        }

        user.suspended = false;
        await user.save();

        // Send unsuspension email
        await sendEmail(
            user.email,
            'Account Restored',
            `Hello ${user.firstName},\n\nYour account has been restored. You may now log in again.\n\nRegards,\nTrailBlazer Team`
        );

        res.json({ message: 'User unsuspended and notified via email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a User Account 
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send account deletion email
        await sendEmail(
            user.email,
            'Account Deleted',
            `Hello ${user.firstName},\n\nYour account has been permanently deleted. If this was a mistake, please contact support.\n\nRegards,\nTrailBlazer Team`
        );

        res.json({ message: 'User account deleted and notified via email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
