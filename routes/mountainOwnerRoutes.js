const express = require('express');
const router = express.Router();
const mountainOwnerController = require('../controllers/mountainOwnerController');
const authMiddleware = require('../middleware/authMiddleware');

// POST: Request a new mountain (Mountain Owner only)
router.post('/request', authMiddleware, mountainOwnerController.requestNewMountain);

// GET: Get all mountain requests submitted by the logged-in owner
router.get('/my-requests', authMiddleware, mountainOwnerController.getMyMountainRequests);

// GET: Check the status of a specific request
router.get('/request-status/:requestId', authMiddleware, mountainOwnerController.getRequestStatus);

// PUT: Edit a mountain request (Mountain Owner only)
router.put('/update-request/:requestId', authMiddleware, mountainOwnerController.updateMountainRequest);

// DELETE: Delete a mountain request (Mountain Owner only)
router.delete('/delete-request/:requestId', authMiddleware, mountainOwnerController.deleteMountainRequest);

module.exports = router;
