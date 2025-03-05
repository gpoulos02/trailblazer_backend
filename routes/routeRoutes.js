const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/routes/find - Find routes based on user input 
router.post('/find', authMiddleware, routeController.findRoutes);

// POST /api/routes/save/:mountainID - Save a new route 
router.post('/save', authMiddleware, routeController.saveRoute);

// GET /api/routes - Get all saved routes for the authenticated user 
router.get('/', authMiddleware, routeController.getUserRoutes);

// DELETE /api/routes/delete/:routeId - Delete a saved route 
router.delete('/delete/:routeId', authMiddleware, routeController.deleteRoute);

module.exports = router;
