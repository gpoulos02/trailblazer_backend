const express = require('express');
const router = express.Router();
const chairliftController = require('../controllers/chairliftController');

// POST: Add multiple chairlifts
router.post('/add-chairlifts', chairliftController.addChairlifts);

// GET: Get all chairlifts for a specific mountain
router.get('/:mountainID', chairliftController.getChairliftsByMountain);

// GET: Get chairlift names for a specific mountain
router.get('/:mountainID/lift-names', chairliftController.getChairliftNames);

module.exports = router;
