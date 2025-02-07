const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Save a ski session 
router.post('/', authMiddleware, metricsController.saveSession);

// GET: Get a list of session dates 
router.get('/dates', authMiddleware, metricsController.getSessionDates);

// GET: Get an overview of metrics 
router.get('/overview', authMiddleware, metricsController.getMetricOverview);

// GET: Get session data by ID 
router.get('/:id', authMiddleware, metricsController.getSessionById);

// DELETE: Delete a specific session 
router.delete('/:id', authMiddleware, metricsController.deleteSession);

// GET: Get all runs by runID 
router.get('/runID/:mountainID/:runID', authMiddleware, metricsController.getRunsByRunID);

// GET: Get all runs by date 
router.get('/date', authMiddleware, metricsController.getRunsByDate);

// GET: Get all runs sorted by top speed 
router.get('/speed', authMiddleware, metricsController.getRunsSortedBySpeed);

// GET: Get all metrics for the user 
router.get('/metrics', authMiddleware, metricsController.getMetricsByUserId);

module.exports = router;

