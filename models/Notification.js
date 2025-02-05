const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['friend_request', 'friend_accept', 'post_like', 'comment', 'direct_message', 'system_alert'], 
        required: true,
    },
    message: {
        type: String, // For general notifications
        required: true,
    },
    title: {
        type: String, // Only used for `direct_message` and `system_alert`
        default: null,
    },
    body: {
        type: String, // Only used for `direct_message` and `system_alert`
        default: null,
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
