
const BlueMountainTrail = require('../models/BlueMountainTrail');
const Chairlift = require('../models/Chairlift');
const PointOfInterest = require('../models/PointOfInterest');
const Route = require('../models/Route');


// Find routes based on user input
exports.findRoutes = async (req, res) => {
    try {
        const { startingLiftName, maxDifficulty, destination } = req.body;

        if (!startingLiftName || !maxDifficulty) {
            return res.status(400).json({ message: "Starting lift name and max difficulty are required." });
        }

        // Find the chairlift by name
        const chairlift = await Chairlift.findOne({ liftName: startingLiftName }).populate('topTrails');
        if (!chairlift || !chairlift.topTrails.length) {
            return res.status(404).json({ message: "No trails found for the given chairlift name." });
        }

        const routes = [];
        const visited = new Set(); // To avoid re-traversing trails

        const traverse = async (trailId, currentPath) => {
            if (visited.has(trailId)) return;
            visited.add(trailId);

            const trail = await BlueMountainTrail.findById(trailId).populate('childTrails endingPoints');
            if (!trail) return;

            // Base case: check for destination or end of mountain
            if (destination && trail.endingPoints.some(poi => poi.toString() === destination)) {
                routes.push([...currentPath, trail]);
                return;
            }
            if (!destination && trail.isEnd) {
                routes.push([...currentPath, trail]);
                return;
            }

            // Recursive case: explore child trails within difficulty
            for (const childTrailId of trail.childTrails) {
                const childTrail = await BlueMountainTrail.findById(childTrailId);
                if (childTrail && isDifficultyAllowed(childTrail.difficulty, maxDifficulty)) {
                    await traverse(childTrailId, [...currentPath, trail]);
                }
            }
        };

        // Helper to check if a trail's difficulty is within maxDifficulty
        const isDifficultyAllowed = (trailDifficulty, maxDifficulty) => {
            const difficulties = ['green', 'blue', 'black', 'double black'];
            return difficulties.indexOf(trailDifficulty) <= difficulties.indexOf(maxDifficulty);
        };

        // Start traversal for each trail from the chairlift
        for (const trail of chairlift.topTrails) {
            await traverse(trail, []);
        }

        // Respond with the found routes
        if (routes.length === 0) {
            return res.status(404).json({ message: "No suitable routes found." });
        }

        res.json(routes.map(route => route.map(trail => ({
            runID: trail.runID,
            runName: trail.runName,
            difficulty: trail.difficulty,
        }))));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
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
            user: req.user.userId, // assumes user ID is stored in req.user by auth middleware
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
        const routes = await Route.find({ user: req.user.userId }).populate('trails');
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
