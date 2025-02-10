const MountainRequest = require('../models/MountainRequest');
const User = require('../models/User');

// Submit a new mountain request (Mountain Owner Only)
exports.requestNewMountain = async (req, res) => {
    try {
        const { name, location, description, geoJson, trails, pointsOfInterest, chairlifts } = req.body;

        // Ensure the user is a mountain owner
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'mountain_owner') {
            return res.status(403).json({ message: "Unauthorized. Only mountain owners can request new mountains." });
        }

        // Validate required fields
        if (!name || !location || !description || !geoJson || !trails || !pointsOfInterest || !chairlifts) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Save the request in the database as 'pending'
        const newRequest = new MountainRequest({
            name,
            location,
            description,
            geoJson,
            trails,
            pointsOfInterest,
            chairlifts,
            submittedBy: req.user.userId,
            status: 'pending'
        });

        await newRequest.save();

        res.status(201).json({ message: "Mountain request submitted successfully. Awaiting admin approval.", requestId: newRequest._id });
    } catch (error) {
        console.error("Error submitting mountain request:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Get all requests submitted by the current mountain owner
exports.getMyMountainRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'mountain_owner') {
            return res.status(403).json({ message: "Unauthorized." });
        }

        const requests = await MountainRequest.find({ submittedBy: req.user.userId });

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching mountain requests:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Get the status of a specific request by ID
exports.getRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find request and ensure it belongs to the logged-in mountain owner
        const request = await MountainRequest.findOne({ _id: requestId, submittedBy: req.user.userId });

        if (!request) {
            return res.status(404).json({ message: "Request not found or you do not have permission to view it." });
        }

        res.status(200).json({ status: request.status, message: `Your request is currently ${request.status}.` });
    } catch (error) {
        console.error("Error fetching request status:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Update a mountain request (Mountain Owner Only)
exports.updateMountainRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { name, location, description, geoJson, trails, pointsOfInterest, chairlifts } = req.body;

        // Find the request and ensure it belongs to the logged-in mountain owner
        const request = await MountainRequest.findOne({ _id: requestId, submittedBy: req.user.userId });

        if (!request) {
            return res.status(404).json({ message: "Request not found or you do not have permission to edit it." });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Cannot edit a request that has already been approved or rejected." });
        }

        // Update request fields
        if (name) request.name = name;
        if (location) request.location = location;
        if (description) request.description = description;
        if (geoJson) request.geoJson = geoJson;
        if (trails) request.trails = trails;
        if (pointsOfInterest) request.pointsOfInterest = pointsOfInterest;
        if (chairlifts) request.chairlifts = chairlifts;

        await request.save();

        res.status(200).json({ message: "Mountain request updated successfully.", updatedRequest: request });
    } catch (error) {
        console.error("Error updating mountain request:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Delete a mountain request (Mountain Owner Only)
exports.deleteMountainRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the request and ensure it belongs to the logged-in mountain owner
        const request = await MountainRequest.findOne({ _id: requestId, submittedBy: req.user.userId });

        if (!request) {
            return res.status(404).json({ message: "Request not found or you do not have permission to delete it." });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Cannot delete a request that has already been approved or rejected." });
        }

        await MountainRequest.deleteOne({ _id: requestId });

        res.status(200).json({ message: "Mountain request deleted successfully." });
    } catch (error) {
        console.error("Error deleting mountain request:", error);
        res.status(500).json({ message: "Server error." });
    }
};
