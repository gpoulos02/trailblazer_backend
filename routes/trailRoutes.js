const express = require('express');
const router = express.Router();
const BlueMountainTrail = require('../models/BlueMountainTrail');

// Endpoint to add multiple trails
router.post('/add-trails', async (req, res) => {
    try {
        const trails = req.body; // Array of trails from request body
        const insertedTrails = await BlueMountainTrail.insertMany(trails);
        res.status(201).json({
            message: 'Trails added successfully',
            data: insertedTrails
        });
    } catch (error) {
        console.error('Error adding trails:', error);
        res.status(500).json({ message: 'Error adding trails', error });
    }
});

// Endpoint to get all trails that start at a given lift
router.get('/trails-by-lift/:liftID', async (req, res) => {
    try {
        const liftID = parseInt(req.params.liftID); // Get the liftID from the URL parameter
        const trails = await BlueMountainTrail.find({ startingLift: liftID }); // Query the database for runs starting at the given lift

        // If no trails are found, return an empty array
        if (trails.length === 0) {
            return res.status(404).json([]);
        }

        // If trails are found, return just the runIDs
        const runIDs = trails.map(trail => trail.runID); // Extract runIDs from the trails

        res.status(200).json(runIDs); // Return the list of runIDs
    } catch (error) {
        console.error('Error querying trails by lift:', error);
        res.status(500).json({ message: 'Error querying trails by lift', error });
    }
});

router.get('/unique-difficulties', async (req, res) => {
    try {
        console.log('Unique difficulties endpoint hit'); // Log for debugging
        const trails = await BlueMountainTrail.find();
        const uniqueDifficulties = [...new Set(trails.map(trail => trail.difficulty))];
        res.status(200).json(uniqueDifficulties);
    } catch (error) {
        console.error('Error querying unique difficulties:', error);
        res.status(500).json({ message: 'Error querying unique difficulties', error });
    }
});

// Endpoint to get the runName from runID
router.get('/run-name/:runID', async (req, res) => {
    try {
        const { runID } = req.params; // Get the runID from the URL parameter
        const trail = await BlueMountainTrail.findOne({ runID }); // Query for the trail with the specified runID

        if (!trail) {
            return res.status(404).json({ message: 'Trail not found' });
        }

        res.status(200).json({ runName: trail.runName }); // Return the runName
    } catch (error) {
        console.error('Error querying runName by runID:', error);
        res.status(500).json({ message: 'Error querying runName by runID', error });
    }
});

// Endpoint to get the runID from runName
router.get('/run-id/:runName', async (req, res) => {
    try {
        const { runName } = req.params; // Get the runName from the URL parameter
        const trail = await BlueMountainTrail.findOne({ runName }); // Query for the trail with the specified runName

        if (!trail) {
            return res.status(404).json({ message: 'Trail not found' });
        }

        res.status(200).json({ runID: trail.runID }); // Return the runID
    } catch (error) {
        console.error('Error querying runID by runName:', error);
        res.status(500).json({ message: 'Error querying runID by runName', error });
    }
});



module.exports = router;
