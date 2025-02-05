const admin = require('../config/firebase');

module.exports = async (req, res, next) => {
    try {
        // Extract the Firebase ID token from request header
        const firebaseAuthHeader = req.header('x-firebase-authorization');
        if (!firebaseAuthHeader) {
            return res.status(401).json({ message: 'No Firebase token, authorization denied' });
        }

        const firebaseToken = firebaseAuthHeader.split(' ')[1]; // Extract token after 'Bearer'
        if (!firebaseToken) {
            return res.status(401).json({ message: 'No Firebase ID token, authorization denied' });
        }

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        
        // Check if email is verified
        if (!decodedToken.email_verified) {
            return res.status(403).json({ message: 'Email not verified' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};
