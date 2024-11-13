const Metrics = require('../models/Metrics');

// Add performance metrics for a session
exports.addMetrics = async (req, res) => {
    try {
        const { sessionData } = req.body;
        const metrics = new Metrics({
            user: req.user.userId,
            sessionData
        });
        await metrics.save();
        res.status(201).json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all performance metrics for the authenticated user
exports.getUserMetrics = async (req, res) => {
    try {
        const metrics = await Metrics.find({ user: req.user.userId });
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get metrics for a specific session by ID
exports.getMetricsById = async (req, res) => {
    try {
        const metrics = await Metrics.findById(req.params.id);
        if (!metrics) return res.status(404).json({ message: 'Metrics not found' });
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
