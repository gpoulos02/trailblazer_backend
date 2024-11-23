const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/metrics - Save a ski session
router.post('/', authMiddleware, metricsController.saveSession);

// GET /api/metrics/dates - Get a list of session dates
router.get('/dates', authMiddleware, metricsController.getSessionDates);

// GET /api/metrics/:id - Get session data for a specific session
router.get('/:id', authMiddleware, metricsController.getSessionById);

// DELETE /api/metrics/:id - Delete a specific session
router.delete('/:id', authMiddleware, metricsController.deleteSession);

// GET /api/metrics/overview - Get an overview of metrics over a specified period
router.get('/overview', authMiddleware, metricsController.getMetricOverview);

module.exports = router;
