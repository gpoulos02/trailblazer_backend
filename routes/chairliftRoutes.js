const express = require('express');
const router = express.Router();
const Chairlift = require('../models/Chairlift'); // Import the Chairlift model
const fs = require('fs');
const path = require('path');

// Endpoint to populate chairlifts from a JSON file
router.post('/populate-chairlifts', async (req, res) => {
    try {
        // Read the chairlifts.json file
        const data = fs.readFileSync(path.join(__dirname, '../chairlifts.json'), 'utf-8');
        const chairlifts = JSON.parse(data); // Parse the JSON data

        // Insert chairlifts into the database
        const insertedChairlifts = await Chairlift.insertMany(chairlifts);

        res.status(201).json({
            message: 'Chairlifts populated successfully',
            data: insertedChairlifts
        });
    } catch (error) {
        console.error('Error populating chairlifts:', error);
        res.status(500).json({ message: 'Error populating chairlifts', error });
    }
});

router.get('/lift-names', async (req, res) => {
    try {
        // Fetch all chairlifts, returning only the 'liftName' field
        const lifts = await Chairlift.find({}, 'liftName'); // This queries the 'liftName' field

        // If no lifts are found, return an empty array
        if (lifts.length === 0) {
            return res.status(404).json({ message: 'No lifts found' });
        }

        // Respond with the lift names
        res.status(200).json({
            message: 'Lift names retrieved successfully',
            lifts: lifts.map(lift => lift.liftName) // Extract lift names from the result
        });
    } catch (error) {
        console.error('Error retrieving lift names:', error);
        res.status(500).json({ message: 'Error retrieving lift names', error });
    }
});

module.exports = router;
