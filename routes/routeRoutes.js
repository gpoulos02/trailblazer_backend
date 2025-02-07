const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/routes/find - Find routes based on user input 
router.post('/find', authMiddleware, routeController.findRoutes);

// POST /api/routes/:mountainID - Save a new route 
router.post('/:mountainID', authMiddleware, routeController.saveRoute);

// GET /api/routes - Get all saved routes for the authenticated user 
router.get('/', authMiddleware, routeController.getUserRoutes);

// DELETE /api/routes/:routeId - Delete a saved route 
router.delete('/:routeId', authMiddleware, routeController.deleteRoute);

// GET /api/routes/:mountainID/runIDByRunName - Get runID by runName 
router.get('/:mountainID/runIDByRunName', authMiddleware, routeController.getRunIDByRunName);

module.exports = router;
