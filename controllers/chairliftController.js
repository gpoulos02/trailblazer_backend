const Chairlift = require('../models/Chairlift');
const Mountain = require('../models/Mountain');

// Add multiple chairlifts

// Add multiple chairlifts
exports.addChairlifts = async (req, res) => {
    try {
        const { chairlifts, mountainID } = req.body;

        if (!chairlifts || !chairlifts.length || mountainID === undefined) {
            return res.status(400).json({ message: "Chairlifts and mountainID are required." });
        }

        // Validate that mountainID exists
        const mountainExists = await Mountain.findOne({ mountainID });
        if (!mountainExists) {
            return res.status(404).json({ message: "Mountain not found." });
        }

        // Get the current highest liftID in the database
        const lastChairlift = await Chairlift.findOne({}, {}, { sort: { liftID: -1 } });
        let nextLiftID = lastChairlift ? lastChairlift.liftID + 1 : 1;

        // Attach mountainID and assign unique liftID to each chairlift
        const chairliftsWithMountain = chairlifts.map(chairlift => ({
            ...chairlift,
            mountainID,
            liftID: nextLiftID++ // Assign and increment liftID
        }));

        // Insert chairlifts
        const insertedChairlifts = await Chairlift.insertMany(chairliftsWithMountain);
        res.status(201).json({
            message: "Chairlifts added successfully.",
            data: insertedChairlifts
        });
    } catch (error) {
        console.error("Error adding chairlifts:", error);
        res.status(500).json({ message: "Error adding chairlifts", error });
    }
};

// Get all chairlifts for a specific mountain
exports.getChairliftsByMountain = async (req, res) => {
    try {
        const { mountainID } = req.params;

        const chairlifts = await Chairlift.find({ mountainID });

        if (!chairlifts.length) {
            return res.status(404).json({ message: "No chairlifts found for this mountain." });
        }

        res.status(200).json(chairlifts);
    } catch (error) {
        console.error("Error retrieving chairlifts:", error);
        res.status(500).json({ message: "Error retrieving chairlifts.", error });
    }
};

// Get chairlift names for a mountain
exports.getChairliftNames = async (req, res) => {
    try {
        const { mountainID } = req.params;

        const lifts = await Chairlift.find({ mountainID }, 'liftName');

        if (!lifts.length) {
            return res.status(404).json({ message: "No lifts found for this mountain." });
        }

        res.status(200).json({
            message: "Lift names retrieved successfully.",
            lifts: lifts.map(lift => lift.liftName)
        });
    } catch (error) {
        console.error("Error retrieving lift names:", error);
        res.status(500).json({ message: "Error retrieving lift names.", error });
    }
};
