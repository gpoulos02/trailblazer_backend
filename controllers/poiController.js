const PointOfInterest = require('../models/PointOfInterest');
const Mountain = require('../models/Mountain');

// Add multiple POIs
exports.addPOIs = async (req, res) => {
    try {
        const { pois, mountainID } = req.body;

        if (!pois || !pois.length || mountainID === undefined) {
            return res.status(400).json({ message: "POIs and mountainID are required." });
        }

        // Validate that mountainID exists
        const mountainExists = await Mountain.findOne({ mountainID });
        if (!mountainExists) {
            return res.status(404).json({ message: "Mountain not found." });
        }

        // Attach mountainID to each POI
        const poisWithMountain = pois.map(poi => ({ ...poi, mountainID }));

        // Insert POIs
        const insertedPOIs = await PointOfInterest.insertMany(poisWithMountain);
        res.status(201).json({
            message: "POIs added successfully.",
            data: insertedPOIs
        });
    } catch (error) {
        console.error("Error adding POIs:", error);
        res.status(500).json({ message: "Error adding POIs", error });
    }
};

// Get all POIs for a specific mountain
exports.getPOIsByMountain = async (req, res) => {
    try {
        const { mountainID } = req.params;

        const pois = await PointOfInterest.find({ mountainID });

        if (!pois.length) {
            return res.status(404).json({ message: "No POIs found for this mountain." });
        }

        res.status(200).json(pois);
    } catch (error) {
        console.error("Error retrieving POIs:", error);
        res.status(500).json({ message: "Error retrieving POIs.", error });
    }
};

// Get POIs by type for a specific mountain
exports.getPOIsByType = async (req, res) => {
    try {
        const { mountainID, type } = req.params;

        const pois = await PointOfInterest.find({ mountainID, type });

        if (!pois.length) {
            return res.status(404).json({ message: `No POIs of type '${type}' found for this mountain.` });
        }

        res.status(200).json(pois);
    } catch (error) {
        console.error("Error retrieving POIs by type:", error);
        res.status(500).json({ message: "Error retrieving POIs by type.", error });
    }
};
