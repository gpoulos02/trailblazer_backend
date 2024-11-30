const Metrics = require('../models/Metrics');

exports.saveSession = async (req, res) => {
    try {
        const { sessionData } = req.body;

        // Validate session data
        if (
            !sessionData.aveSpeed ||
            !sessionData.topSpeed ||
            !sessionData.distance ||
            !sessionData.elevationGain ||
            !sessionData.duration
        ) {
            return res.status(400).json({ message: 'All session data fields are required' });
        }

        const metrics = new Metrics({
            user: req.user.userID,
            sessionData,
        });

        await metrics.save();
        res.status(201).json(metrics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSessionDates = async (req, res) => {
    try {
        // Fetch only session dates 
        const sessions = await Metrics.find({ user: req.user.userID })
            .sort({ createdAt: -1 }) // Sort by most recent
            .select('createdAt') // 
            .exec();

        // Format the response to only include dates
        const sessionDates = sessions.map(session => ({
            id: session._id, // Include the session ID for frontend use
            date: session.createdAt,
        }));

        res.json(sessionDates);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSessionById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the session by ID
        const session = await Metrics.findById(id);

        // Check if the session exists
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // User Authentication
        if (session.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // Return the session data
        res.json(session);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the session by ID
        const session = await Metrics.findById(id);

        // Check if the session exists
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Ensure the authenticated user owns the session
        if (session.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        // Delete the session
        await Metrics.findByIdAndDelete(id);

        // Respond with success message
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Server error' });
    }
};

//gets an overview of all metrics over a given period
exports.getMetricOverview = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const filter = { user: req.user.userId };
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Fetch sessions within the time frame
        const sessions = await Metrics.find(filter).select('sessionData').exec();

        if (!sessions.length) {
            return res.status(404).json({ message: 'No sessions found for the specified time frame' });
        }

        // Calculate the aggregate metrics
        const totalSessions = sessions.length;
        const totalDistance = sessions.reduce((sum, session) => sum + session.sessionData.distance, 0);
        const totalElevation = sessions.reduce((sum, session) => sum + session.sessionData.elevationGain, 0);
        const averageSpeed = sessions.reduce((sum, session) => sum + session.sessionData.aveSpeed, 0) / totalSessions;
        const averageDistance = totalDistance / totalSessions;
        const averageElevation = totalElevation / totalSessions;
        const topSpeed = Math.max(...sessions.map(session => session.sessionData.topSpeed));
        const longestDistance = Math.max(...sessions.map(session => session.sessionData.distance));
        const mostElevation = Math.max(...sessions.map(session => session.sessionData.elevationGain));

        // Build and send the response
        const overview = {
            averageSpeed,
            topSpeed,
            averageDistance,
            longestDistance,
            totalDistance,
            averageElevation,
            mostElevation,
            totalElevation,
        };

        res.json(overview);
    } catch (error) {
        console.error(error); // Log errors for debugging
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = exports;
