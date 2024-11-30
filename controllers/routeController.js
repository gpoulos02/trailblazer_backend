
const mongoose = require('mongoose');
const BlueMountainTrail = require('../models/BlueMountainTrail');
const Chairlift = require('../models/Chairlift');
const PointOfInterest = require('../models/PointOfInterest');

exports.findRoutes = async (req, res) => {
    try {
        const { chairliftName, maxDifficulty, destination } = req.body;

        // Validate mandatory parameters
        if (!chairliftName || !maxDifficulty) {
            return res.status(400).json({ message: "chairliftName and maxDifficulty are required." });
        }
        // Find the chairlift by name
        const chairlift = await Chairlift.findOne({ liftName: chairliftName }).populate({
            path: 'topTrails',
            model: 'BlueMountainTrail',
            localField: 'topTrails',
            foreignField: 'runID',
            options: { select: 'runID runName difficulty' }
        });
        if (!chairlift || !chairlift.topTrails.length) {
            return res.status(404).json({ message: "No trails found for the given chairlift name." });
        }

        // Difficulty mapping for filtering
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
        
            if (visited.has(trailRunID)) return; // Prevent infinite loops
            visited.add(trailRunID);
        
            console.log('Visiting Trail ID:', trailRunID);
        
            // Find the current trail in the database and populate its relationships
            const trail = await BlueMountainTrail.findOne({ runID: trailRunID })
                .populate({
                    path: 'childTrails',
                    model: 'BlueMountainTrail',
                    localField: 'childTrails',
                    foreignField: 'runID',
                    options: { select: 'runID runName difficulty' }
                })
                .populate({
                    path: 'endingPoints',
                    model: 'PointOfInterest',
                    localField: 'endingPoints',
                    foreignField: 'POI_id',
                    options: { select: 'POI_id POI_name type' }
                });
        
            if (!trail) {
                console.error(`Trail with runID ${trailRunID} not found.`);
                return;
            }
        
            if (!validDifficulties.includes(trail.difficulty)) return;
        
            // Add the current trail as a standalone route if it's an end trail
            if (trail.isEnd || (destination && trail.endingPoints.some(point => point.POI_id === destination))) {
                routes.push([...currentPath, trail]);
            }
        
            // Recursively traverse child trails
            for (const childTrail of trail.childTrails) {
                if (childTrail && childTrail.runID) {
                    console.log(`Branching to child trail: ${childTrail.runID}`);
                    await traverse(childTrail, [...currentPath, trail]); // Pass the updated path
                } else {
                    console.warn('Invalid childTrail:', childTrail);
                }
            }
        };
        
        
        // Start traversal from each trail at the chairlift
        for (const trailObj of chairlift.topTrails) {
            console.log("starting traverse for " + trailObj)
            await traverse(trailObj, []); // Assuming `chairlift.topTrails` contains trail objects
        }
        
        // Respond with the found routes
        if (routes.length === 0) {
            return res.status(404).json({ message: "No suitable routes found." });
        }
        
        res.json(
            routes.map(route =>
                route.map(trail => ({
                    runID: trail.runID,
                    runName: trail.runName,
                    difficulty: trail.difficulty
                }))
            )
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

        if (!name || !trails || !trails.length) {
            return res.status(400).json({ message: "Route name and trails are required." });
        }

        const route = new Route({
            user: req.user.userID, // assumes user ID is stored in req.user by auth middleware
            name,
            trails,
        });

        await route.save();
        res.status(201).json({ message: "Route saved successfully.", route });
    } catch (error) {
        console.error(error);
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

module.exports = exports;
