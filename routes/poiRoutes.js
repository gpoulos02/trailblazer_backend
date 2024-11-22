const express = require('express');
const fs = require('fs');
const PointOfInterest = require('../models/PointOfInterest');
const router = express.Router();

// POST: Populate the database with POIs from POIs.json
router.post('/populate', async (req, res) => {
    try {
        // Read POIs from the JSON file
        const data = fs.readFileSync('./POIs.json', 'utf8');
        const pois = JSON.parse(data);

        // Insert POIs into the database
        await PointOfInterest.insertMany(pois, { ordered: false });
        console.log('POIs populated successfully!');
        res.status(201).json({ message: 'Database populated successfully!' });
    } catch (error) {
        console.error('Error populating POIs:', error); // Log error
        if (error.code === 11000) {
            res.status(400).json({ message: 'Some POIs already exist.', error });
        } else {
            res.status(500).json({ message: 'Server error.', error });
        }
    }
});

// GET: Retrieve all POIs
router.get('/get-pois', async (req, res) => {
    try {
        const pois = await PointOfInterest.find();
        console.log('Fetched POIs:', pois); // Log POIs being sent to the client
        res.status(200).json(pois);
    } catch (error) {
        console.error('Error fetching POIs:', error); // Log error
        res.status(500).json({ message: 'Server error.', error });
    }
});

module.exports = router;
