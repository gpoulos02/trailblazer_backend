const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather - Get weather data for a specific location
router.get('/', weatherController.getWeatherData);

module.exports = router;
