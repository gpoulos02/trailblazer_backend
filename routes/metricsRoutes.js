const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/metrics - Add performance metrics for a session
router.post('/', authMiddleware, metricsController.addMetrics);

// GET /api/metrics - Get all performance metrics for the authenticated user
router.get('/', authMiddleware, metricsController.getUserMetrics);

// GET /api/metrics/:id - Get metrics for a specific session by ID
router.get('/:id', authMiddleware, metricsController.getMetricsById);

module.exports = router;
