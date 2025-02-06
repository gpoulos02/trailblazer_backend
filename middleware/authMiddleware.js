const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InvalidatedToken = require('../models/InvalidatedToken');

module.exports = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token missing, authorization denied' });
    }

    try {
        // Check if the token is invalidated
        const invalidated = await InvalidatedToken.findOne({ token });
        if (invalidated) {
            return res.status(401).json({ message: 'Invalid token, authorization denied' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user details from the database
        const user = await User.findOne({ userID: decoded.userID });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Block suspended users
        if (user.suspended) {
            return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
        }

        // Attach user details to req.user
        req.user = {
            userID: user.userID, // UUID
            role: user.role,     // Role (admin, user, mountain_owner)
        };

        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};
