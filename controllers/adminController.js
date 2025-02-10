const Post = require('../models/Post');
const MountainRequest = require('../models/MountainRequest'); 
const Report = require('../models/Report');
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

// Approve a Mountain Owner 
exports.demoteMountainOwner = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = 'user';
        await user.save();

        // Send  email
        await sendEmail(
            user.email,
            'Mountain Owner Demotion',
            `Hello ${user.firstName},\n\nUnfortunately, You have been demoted as a Mountain Owner. You now no longer have access to additional features within the TrailBlazer app.\n\nRegards,\nTrailBlazer Team`
        );

        // Send in-app notification
        await sendNotification(
            user._id,
            'system_alert',
            '',
            'Mountain Owner Demotion',
            'You have been demoted from being a Mountain Owner!'
        );

        res.json({ message: 'User demoted from Mountain Owner and notified' });
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
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete all posts by the user
        await Post.deleteMany({ user: user._id });

        // Delete the user
        await User.findByIdAndDelete(user._id);

        // Delete related reports
        await Report.deleteMany({ reportedBy: user._id });

        // Notify user via email
        await sendEmail(
            user.email,
            'Account Deleted',
            `Hello ${user.firstName},\n\nYour account has been permanently deleted due to repeated violations. If this was a mistake, please contact support.\n\nRegards,\nTrailBlazer Team`
        );

        res.status(200).json({ message: 'User account and all associated posts deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all reported posts (Admin only)
exports.getReportedPosts = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('post', 'textContent route performance')
            .populate('reportedBy', 'username');

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

//delete post fopr admins
exports.adminDeletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        await Post.findByIdAndDelete(postId);
        res.status(200).json({ message: 'Post deleted by admin' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin action: Ignore, Delete Post, Suspend/Delete User
exports.adminActionOnReport = async (req, res) => {
    try {
        const { reportId, action } = req.body; // action = 'ignore', 'delete_post', 'suspend_user', 'delete_user'

        const report = await Report.findById(reportId).populate('post');
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const post = await Post.findById(report.post._id);
        const user = await User.findById(post.user);

        if (action === 'ignore') {
            await report.delete();
            return res.status(200).json({ message: 'Report ignored' });
        }

        if (action === 'delete_post') {
            await exports.adminDeletePost({ params: { postId: post._id } }, res); // Call the admin delete function
            await report.delete();
            return;
        }

        if (action === 'suspend_user') {
            await exports.suspendUser({ params: { userId: user._id } }, res); // Use existing function
            return;
        }

        if (action === 'delete_user') {
            await exports.deleteUser({ params: { userId: user._id } }, res); // Use existing function
            return;
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all pending mountain requests
exports.getMountainRequests = async (req, res) => {
    try {
        const requests = await MountainRequest.find({ status: 'pending' });
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching mountain requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a specific mountain request by ID
exports.getMountainRequestById = async (req, res) => {
    try {
        const request = await MountainRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json(request);
    } catch (error) {
        console.error('Error fetching request details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Accept a mountain request
exports.acceptMountainRequest = async (req, res) => {
    try {
        const request = await MountainRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Placeholder for additional acceptance logic
        // TODO: Implement logic to integrate accepted mountain requests into the system

        request.status = 'accepted';
        await request.save();

        // Notify user
        await sendNotification(
            request.ownerId,
            'system_alert',
            '',
            'Mountain Request Approved',
            `Your request for ${request.mountainName} has been approved!`
        );

        // Send email
        await sendEmail(
            request.ownerEmail,
            'Mountain Request Approved',
            `Your request for ${request.mountainName} has been approved.`
        );

        res.status(200).json({ message: 'Mountain request accepted successfully.' });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Deny a mountain request
exports.denyMountainRequest = async (req, res) => {
    try {
        const request = await MountainRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await MountainRequest.findByIdAndDelete(req.params.id);

        // Notify user
        await sendNotification(
            request.ownerId,
            'system_alert',
            '',
            'Mountain Request Denied',
            `Unfortunately, your request for ${request.mountainName} has been denied.`
        );

        // Send email
        await sendEmail(
            request.ownerEmail,
            'Mountain Request Denied',
            `Unfortunately, your request for ${request.mountainName} has been denied.`
        );

        res.status(200).json({ message: 'Mountain request denied and deleted successfully.' });
    } catch (error) {
        console.error('Error denying request:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

