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

module.exports = router;
