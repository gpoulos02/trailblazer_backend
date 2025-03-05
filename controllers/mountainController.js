const Mountain = require('../models/Mountain');

// Get all mountains
exports.getAllMountains = async (req, res) => {
    try {
        const mountains = await Mountain.find().select('-__v'); // Exclude version field
        if (!mountains.length) {
            return res.status(404).json({ message: "No mountains found." });
        }
        res.status(200).json(mountains);
    } catch (error) {
        console.error("Error retrieving mountains:", error);
        res.status(500).json({ message: "Server error while retrieving mountains." });
    }
};

// Get a specific mountain by mountainID
exports.getMountainById = async (req, res) => {
    try {
        const { mountainID } = req.params;
        const mountain = await Mountain.findOne({ mountainID });

        if (!mountain) {
            return res.status(404).json({ message: "Mountain not found." });
        }

        res.status(200).json(mountain);
    } catch (error) {
        console.error("Error retrieving mountain:", error);
        res.status(500).json({ message: "Server error while retrieving mountain." });
    }
};