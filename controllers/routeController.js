const Route = require('../models/Route');

// Create a new route
exports.createRoute = async (req, res) => {
    try {
        const { name, waypoints } = req.body;
        const route = new Route({
            user: req.user.userId, // assumes user ID is stored in req.user by auth middleware
            name,
            waypoints
        });
        await route.save();
        res.status(201).json(route);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all routes for the authenticated user
exports.getUserRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ user: req.user.userId });
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a specific route by ID
exports.getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a route
exports.updateRoute = async (req, res) => {
    try {
        const { name, waypoints } = req.body;
        const route = await Route.findByIdAndUpdate(
            req.params.id,
            { name, waypoints },
            { new: true }
        );
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json({ message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
