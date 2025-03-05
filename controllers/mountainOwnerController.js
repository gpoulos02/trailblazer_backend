const MountainRequest = require('../models/MountainRequest');
const User = require('../models/User');
const multer = require('multer');

const upload = multer().fields([
    { name: 'trailsFile', maxCount: 1 },
    { name: 'pointsOfInterestFile', maxCount: 1 },
    { name: 'chairliftsFile', maxCount: 1 },
    { name: 'geoJsonFile', maxCount: 1 }
]);

exports.requestNewMountain = async (req, res) => {
    upload(req, res, async function (err) {
        try {
            if (err) {
                return res.status(400).json({ message: "File upload error.", error: err });
            }

            const { name, location, description } = req.body;

            const user = await User.findById(req.user.userId);
            if (!user || user.role !== 'mountain_owner') {
                return res.status(403).json({ message: "Unauthorized. Only mountain owners can request new mountains." });
            }

            if (!name || !location || !description || !req.files) {
                return res.status(400).json({ message: "Missing required fields or files." });
            }

            // Helper function to parse JSON files
            const parseJSONFile = (file) => file ? JSON.parse(file.buffer.toString()) : [];

            const newRequest = new MountainRequest({
                name,
                location: JSON.parse(location),
                description,
                geoJson: parseJSONFile(req.files.geoJsonFile ? req.files.geoJsonFile[0] : null),
                trails: parseJSONFile(req.files.trailsFile ? req.files.trailsFile[0] : null),
                pointsOfInterest: parseJSONFile(req.files.pointsOfInterestFile ? req.files.pointsOfInterestFile[0] : null),
                chairlifts: parseJSONFile(req.files.chairliftsFile ? req.files.chairliftsFile[0] : null),
                submittedBy: req.user.userId,
                status: 'pending'
            });

            await newRequest.save();

            res.status(201).json({ 
                message: "Mountain request submitted successfully.", 
                requestId: newRequest._id
            });
        } catch (error) {
            console.error("Error submitting mountain request:", error);
            res.status(500).json({ message: "Server error." });
        }
    });
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
