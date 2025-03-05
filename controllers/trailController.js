const Trail = require('../models/Trail');

// Add multiple trails
exports.addTrails = async (req, res) => {
    try {
        const { trails, mountainID } = req.body;

        if (!trails || !trails.length || mountainID === undefined) {
            return res.status(400).json({ message: "Trails and mountainID are required." });
        }

        // Validate that mountainID exists
        const mountainExists = await Mountain.findOne({ mountainID });
        if (!mountainExists) {
            return res.status(404).json({ message: "Mountain not found." });
        }

        // Attach mountainID to each trail
        const trailsWithMountain = trails.map(trail => ({ ...trail, mountainID }));

        // Insert trails
        const insertedTrails = await Trail.insertMany(trailsWithMountain);
        res.status(201).json({
            message: "Trails added successfully.",
            data: insertedTrails
        });
    } catch (error) {
        console.error("Error adding trails:", error);
        res.status(500).json({ message: "Error adding trails", error });
    }
};

// Get all trails for a specific mountain
exports.getTrailsByMountain = async (req, res) => {
    try {
        const { mountainID } = req.params;

        const trails = await Trail.find({ mountainID });

        if (!trails.length) {
            return res.status(404).json({ message: "No trails found for this mountain." });
        }

        res.status(200).json(trails);
    } catch (error) {
        console.error("Error retrieving trails:", error);
        res.status(500).json({ message: "Error retrieving trails.", error });
    }
};

// Get all trails that start at a specific lift
exports.getTrailsByLift = async (req, res) => {
    try {
        const { mountainID, liftID } = req.params;

        const trails = await Trail.find({ startingLift: liftID, mountainID });

        if (!trails.length) {
            return res.status(404).json([]);
        }

        res.status(200).json(trails.map(trail => trail.runID));
    } catch (error) {
        console.error("Error retrieving trails by lift:", error);
        res.status(500).json({ message: "Error retrieving trails by lift.", error });
    }
};

// Get unique difficulties for a mountain
exports.getUniqueDifficulties = async (req, res) => {
    try {
        const { mountainID } = req.params;

        const trails = await Trail.find({ mountainID });
        const uniqueDifficulties = [...new Set(trails.map(trail => trail.difficulty))];

        res.status(200).json(uniqueDifficulties);
    } catch (error) {
        console.error("Error retrieving unique difficulties:", error);
        res.status(500).json({ message: "Error retrieving unique difficulties.", error });
    }
};

// Get trail name by runID
exports.getRunNameByRunID = async (req, res) => {
    try {
        const { runID, mountainID } = req.params;  // Fix: use runID instead of runName

        if (!runID || !mountainID) {
            return res.status(400).json({ message: "runID and mountainID are required." });
        }

        const trail = await Trail.findOne({ runID, mountainID });

        if (!trail) {
            return res.status(404).json({ message: "Trail not found." });
        }

        res.status(200).json({ runName: trail.runName });
    } catch (error) {
        console.error("Error retrieving runName by runID:", error);
        res.status(500).json({ message: "Server error." });
    }
};



// Get runID by trail name
exports.getRunIDByRunName = async (req, res) => {
    try {
        const { runName, mountainID } = req.params;

        const trail = await Trail.findOne({ runName, mountainID });

        if (!trail) {
            return res.status(404).json({ message: "Trail not found." });
        }

        res.status(200).json({ runID: trail.runID });
    } catch (error) {
        console.error("Error retrieving runID by runName:", error);
        res.status(500).json({ message: "Error retrieving runID by runName.", error });
    }
};
