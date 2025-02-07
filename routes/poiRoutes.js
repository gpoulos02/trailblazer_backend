const express = require('express');
const router = express.Router();
const poiController = require('../controllers/poiController');

// POST: Add multiple POIs
router.post('/add-pois', poiController.addPOIs);

// GET: Get all POIs for a specific mountain
router.get('/:mountainID', poiController.getPOIsByMountain);

// GET: Get POIs by type for a specific mountain
router.get('/:mountainID/type/:type', poiController.getPOIsByType);

module.exports = router;
