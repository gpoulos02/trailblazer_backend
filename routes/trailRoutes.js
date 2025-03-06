const express = require('express');
const router = express.Router();
const trailController = require('../controllers/trailController');

// POST: Add multiple trails
router.post('/add-trails', trailController.addTrails);

// GET: Get all trails for a mountain
router.get('/:mountainID', trailController.getTrailsByMountain);

// GET: Get all trails starting at a given lift
router.get('/:mountainID/lift/:liftID', trailController.getTrailsByLift);

// GET: Get unique difficulties for a mountain
router.get('/:mountainID/unique-difficulties', trailController.getUniqueDifficulties);

// GET: Get runName by runID
router.get('/:mountainID/run-name/:runID', trailController.getRunNameByRunID);

// GET: Get runID by runName
router.get('/:mountainID/run-id/:runName', trailController.getRunIDByRunName);

// get trail difficulties 
router.post('/:mountainID/trail-difficulty', trailController.getTrailDifficulty);

module.exports = router;
