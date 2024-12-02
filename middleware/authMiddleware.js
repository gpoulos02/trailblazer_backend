const jwt = require('jsonwebtoken');
const InvalidatedToken = require('../models/InvalidatedToken'); // Import the InvalidatedToken model

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
        // Check if the token is in the invalidated tokens collection
        const invalidated = await InvalidatedToken.findOne({ token });
        if (invalidated) {
            return res.status(401).json({ message: 'Invalid token, authorization denied' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach both userId and userID to req.user
        req.user = {
            id: decoded.userId,   // MongoDB ObjectID
            userID: decoded.userID, // UUID
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
