const express = require('express');
const router = express.Router();
const mountainController = require('../controllers/mountainController');


// GET: Retrieve all mountains
router.get('/', mountainController.getAllMountains);

// GET: Retrieve a specific mountain by mountainID
router.get('/:mountainID', mountainController.getMountainById);

module.exports = router;