
const mongoose = require('mongoose');
const Trail = require('../models/Trail');
const Chairlift = require('../models/Chairlift');
const PointOfInterest = require('../models/PointOfInterest');


exports.findRoutes = async (req, res) => {
    try {
        const { chairliftName, maxDifficulty, destination, mountainID } = req.body;

        if (!chairliftName || !maxDifficulty || mountainID === undefined) {
            return res.status(400).json({ message: "chairliftName, maxDifficulty, and mountainID are required." });
        }

        // Find the chairlift by name & mountainID
        const chairlift = await Chairlift.findOne({ liftName: chairliftName, mountainID })
            .populate({
                path: 'topTrails',
                model: 'Trail',
                options: { select: 'runID runName difficulty' }
            });

        if (!chairlift || !chairlift.topTrails.length) {
            return res.status(404).json({ message: "No trails found for this chairlift." });
        }

        const allowedDifficulties = {
            'green': ['green'],
            'blue': ['green', 'blue'],
            'black': ['green', 'blue', 'black'],
            'double black': ['green', 'blue', 'black', 'double black']
        };

        const validDifficulties = allowedDifficulties[maxDifficulty.toLowerCase()];
        if (!validDifficulties) {
            return res.status(400).json({ message: "Invalid maxDifficulty value." });
        }

        const routes = [];
        const visited = new Set();

        const traverse = async (trailObj, currentPath) => {
            const trailRunID = trailObj.runID;
            if (visited.has(trailRunID)) return;
            visited.add(trailRunID);

            const trail = await Trail.findOne({ runID: trailRunID, mountainID })
                .populate({ path: 'childTrails', model: 'Trail', options: { select: 'runID runName difficulty' } })
                .populate({ path: 'endingPoints', model: 'PointOfInterest', options: { select: 'POI_id POI_name type' } });

            if (!trail || !validDifficulties.includes(trail.difficulty)) return;

            if (trail.isEnd || (destination && trail.endingPoints.some(point => point.POI_id === destination))) {
                routes.push([...currentPath, trail]);
            }

            for (const childTrail of trail.childTrails) {
                if (childTrail && childTrail.runID) {
                    await traverse(childTrail, [...currentPath, trail]);
                }
            }
        };

        for (const trailObj of chairlift.topTrails) {
            await traverse(trailObj, []);
        }

        if (routes.length === 0) {
            return res.status(404).json({ message: "No suitable routes found." });
        }

        res.json(
            routes.map(route => route.map(trail => ({
                runID: trail.runID,
                runName: trail.runName,
                difficulty: trail.difficulty
            })))
        );

    } catch (error) {
        console.error('Error finding routes:', error);
        res.status(500).json({ message: "Server error." });
    }
};



// Save a route
exports.saveRoute = async (req, res) => {
    try {
        const { name, trails } = req.body;
        const { mountainID } = req.params; 

        // Validate input
        if (!name || !trails || !trails.length || mountainID === undefined) {
            return res.status(400).json({ message: "Route name, trails, and mountainID are required." });
        }

        // Check if the provided mountainID exists
        const mountainExists = await Mountain.findOne({ mountainID });
        if (!mountainExists) {
            return res.status(404).json({ message: "Mountain not found." });
        }

        // Create new route with mountainID
        const route = new Route({
            user: req.user.userID, // Assumes user ID is stored in req.user by auth middleware
            name,
            trails,
            mountainID
        });

        await route.save();
        res.status(201).json({ message: "Route saved successfully.", route });
    } catch (error) {
        console.error("Error saving route:", error);
        res.status(500).json({ message: "Server error while saving route." });
    }
};



// Load all saved routes for the user
exports.getUserRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ user: req.user.userID }).populate('trails');
        if (!routes.length) {
            return res.status(404).json({ message: "No saved routes found." });
        }
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching routes." });
    }
};

// Delete a saved route
exports.deleteRoute = async (req, res) => {
    try {
        const { routeId } = req.params;

        const route = await Route.findByIdAndDelete(routeId);
        if (!route) {
            return res.status(404).json({ message: "Route not found." });
        }
        res.json({ message: "Route deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while deleting route." });
    }
};

//IS THIS USED?
exports.getRunIDByRunName = async (req, res) => {
    try {
        const { runName, mountainID } = req.query;  

        if (!runName || !mountainID) {
            return res.status(400).json({ message: 'runName and mountainID are required' });
        }

        // Fetch the trail by runName and mountainID
        const trail = await Trail.findOne({ runName, mountainID });

        if (!trail) {
            return res.status(404).json({ message: 'Trail not found' });
        }

        res.json({ runID: String(trail.runID) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;
