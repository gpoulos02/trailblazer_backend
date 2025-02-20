
const mongoose = require('mongoose');
const BlueMountainTrail = require('../models/BlueMountainTrail');
const Chairlift = require('../models/Chairlift');
const PointOfInterest = require('../models/PointOfInterest');
const { v4 : uuidv4 } = require('uuid');
const Route = require('../models/Route');



exports.findRoutes = async (req, res) => {
    try {
        const { chairliftName, maxDifficulty, destination } = req.body;

        console.log("Request received with parameters:", { chairliftName, maxDifficulty, destination });

        // Validate mandatory parameters
        if (!chairliftName || !maxDifficulty) {
            console.error("Validation failed: chairliftName or maxDifficulty missing.");
            return res.status(400).json({ message: "chairliftName and maxDifficulty are required." });
        }

        // Find the chairlift by name
        console.log(`Searching for chairlift with name: ${chairliftName}`);
        const chairlift = await Chairlift.findOne({ liftName: chairliftName }).populate({
            path: 'topTrails',
            model: 'BlueMountainTrail',
            localField: 'topTrails',
            foreignField: 'runID',
            options: { select: 'runID runName difficulty' }
        });

        if (!chairlift || !chairlift.topTrails.length) {
            console.warn(`No trails found for the given chairlift name: ${chairliftName}`);
            return res.status(404).json({ message: "No trails found for the given chairlift name." });
        }

        console.log(`Chairlift found: ${chairlift.liftName}, Top trails: ${chairlift.topTrails.length}`);

        // Difficulty mapping for filtering
        const allowedDifficulties = {
            'green': ['green'],
            'blue': ['green', 'blue'],
            'black': ['green', 'blue', 'black'],
            'double black': ['green', 'blue', 'black', 'double black']
        };

        const validDifficulties = allowedDifficulties[maxDifficulty.toLowerCase()];
        if (!validDifficulties) {
            console.error(`Invalid maxDifficulty value provided: ${maxDifficulty}`);
            return res.status(400).json({ message: "Invalid maxDifficulty value." });
        }

        console.log(`Valid difficulties based on maxDifficulty (${maxDifficulty}):`, validDifficulties);

        const routes = [];
        const visited = new Set();

        const traverse = async (trailObj, currentPath) => {
            const trailRunID = trailObj.runID;

            if (visited.has(trailRunID)) {
                console.debug(`Skipping already visited trail: ${trailRunID}`);
                return; // Prevent infinite loops
            }
            visited.add(trailRunID);

            console.log(`Visiting trail: ${trailRunID}`);

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
                console.error(`Trail with runID ${trailRunID} not found in the database.`);
                return;
            }

            console.log(`Trail found: ${trail.runName}, Difficulty: ${trail.difficulty}`);

            if (!validDifficulties.includes(trail.difficulty)) {
                console.debug(`Skipping trail due to difficulty filter: ${trail.difficulty}`);
                return;
            }

            // Add the current trail as a standalone route if it's an end trail
            if (trail.isEnd || (destination && trail.endingPoints.some(point => point.POI_id === destination))) {
                console.log(`Adding end trail to routes: ${trail.runName}`);
                routes.push([...currentPath, trail]);
            }

            // Recursively traverse child trails
            for (const childTrail of trail.childTrails) {
                if (childTrail && childTrail.runID) {
                    console.log(`Branching to child trail: ${childTrail.runID}`);
                    await traverse(childTrail, [...currentPath, trail]); // Pass the updated path
                } else {
                    console.warn('Invalid childTrail found during traversal:', childTrail);
                }
            }
        };

        // Start traversal from each trail at the chairlift
        for (const trailObj of chairlift.topTrails) {
            console.log(`Starting traversal for trail: ${trailObj.runID}`);
            await traverse(trailObj, []); // Assuming `chairlift.topTrails` contains trail objects
        }

        // Respond with the found routes
        if (routes.length === 0) {
            console.warn("No suitable routes found after traversal.");
            return res.status(404).json({ message: "No suitable routes found." });
        }

        console.log(`Routes found: ${routes.length}`);
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
            routeID: uuidv4(), // Generate a random UUID for routeID
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
exports.getRunIDByRunName = async (req, res) => {
    try {
        const { runName } = req.query;  // Get runName from the query string

        if (!runName) {
            return res.status(400).json({ message: 'runName is required' });
        }

        // Fetch the trail by runName
        const trail = await BlueMountainTrail.findOne({ runName });

        if (!trail) {
            return res.status(404).json({ message: 'Trail not found' });
        }

        // Respond with the runID
        res.json({ runID: String(trail.runID) }); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getRunNameByRunID = async (req, res) => {
    try {
        const { runID } = req.query;  // Get runID from query parameter

        if (!runID) {
            return res.status(400).json({ message: 'runID is required' });
        }

        // Find the trail by runID
        const trail = await BlueMountainTrail.findOne({ runID });

        if (!trail) {
            return res.status(404).json({ message: 'Trail not found for the provided runID' });
        }

        // Return the runName (or trail name) from the BlueMountainTrail model
        res.json({ runName: String(trail.runName) });
    } catch (error) {
        console.error('Error fetching run name:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

//get all route names 
// get all route names
exports.getRouteNames = async (req, res) => {
    try {
        // Fetch all trails, returning only the 'runName' field
        const trails = await BlueMountainTrail.find({}, 'runName'); // This queries the 'runName' field
        //console.log("Fetched trails:", trails); // Debugging: Log the fetched trails

        // If no trails are found, return an empty array with a message
        if (trails.length === 0) {
            console.log("No routes found in the database."); // Debugging: Log if no routes are found
            return res.status(404).json({ message: 'No routes found', routes: [] });
        }

        // Respond with the trail names in the expected format
        const trailNames = trails.map(trail => trail.runName);
        //console.log("Trail names to return:", trailNames); // Debugging: Log the names that will be returned

        res.status(200).json({
            message: 'Route names retrieved successfully',
            routes: trailNames // Extract the runName from each trail document
        });
    } catch (error) {
        console.error('Error retrieving route names:', error); // Debugging: Log the error
        res.status(500).json({ message: 'Error retrieving route names', error: error.message });
    }
};





module.exports = exports;
