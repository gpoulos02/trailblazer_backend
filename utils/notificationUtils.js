const Notification = require('../models/Notification');

/**
 * Sends a notification based on event type
 * @param {String} userId - The recipient's user ID
 * @param {String} type - Type of notification (friend_request, post_like, comment, system_alert, direct_message)
 * @param {String} senderName - Name of the sender (for generic notifications)
 * @param {String} title - (Optional) Title for admin/direct messages
 * @param {String} body - (Optional) Body for admin/direct messages
 */
const sendNotification = async (userId, type, senderName = '', title = '', body = '') => {
    try {
        let message = '';

        switch (type) {
            case 'friend_request':
                message = `${senderName} sent you a friend request.`;
                break;
            case 'friend_accept':
                message = `${senderName} accepted your friend request.`;
                break;
            case 'post_like':
                message = `${senderName} liked your post.`;
                break;
            case 'comment':
                message = `${senderName} commented on your post.`;
                break;
            case 'direct_message':
                message = `${title}: ${body}`;
                break;
            case 'system_alert':
                message = `${title}: ${body}`;
                break;
            default:
                console.error(`Unknown notification type: ${type}`);
                return;
        }

        const notification = new Notification({
            user: userId,
            type,
            message,
        });

        await notification.save();
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

module.exports = { sendNotification };
