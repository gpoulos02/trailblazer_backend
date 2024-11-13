const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/routes - Create a new route
router.post('/', authMiddleware, routeController.createRoute);

// GET /api/routes - Get all routes for the authenticated user
router.get('/', authMiddleware, routeController.getUserRoutes);

// GET /api/routes/:id - Get a specific route by ID
router.get('/:id', authMiddleware, routeController.getRouteById);

// PUT /api/routes/:id - Update a route
router.put('/:id', authMiddleware, routeController.updateRoute);

// DELETE /api/routes/:id - Delete a route
router.delete('/:id', authMiddleware, routeController.deleteRoute);

module.exports = router;
