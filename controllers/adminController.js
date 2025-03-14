
const Post = require('../models/Post');
const MountainRequest = require('../models/MountainRequest'); 
const Report = require('../models/Report');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Fuse = require('fuse.js');
const { sendNotification } = require('../utils/notificationUtils');


exports.approveMountainOwner = async (req, res) => {
    try {
        console.log('Attempting to approve Mountain Owner for userId:', req.params.userId);  // Debug: log the userId being processed
        
        // Find the user by ID
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            console.log('User not found with userId:', req.params.userId);  // Debug: log if user not found
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found:', user);  // Debug: log the user object when found

        // Check if the user is already a Mountain Owner
        if (user.role === 'mountain_owner') {
            console.log('User is already a Mountain Owner');  // Debug: log if user is already a Mountain Owner
            return res.status(400).json({ message: 'User is already a Mountain Owner' });
        }

        // Update the user's role to 'mountain_owner'
        user.role = 'mountain_owner';
        await user.save();

        console.log('User role updated to mountain_owner.');  // Debug: log that the user's role has been updated

        // Send approval email
        await sendEmail(
            user.email,
            'Mountain Owner Approval',
            `Hello ${user.firstName},\n\nCongratulations! You have been approved as a Mountain Owner. You now have access to additional features within the TrailBlazer app.\n\nRegards,\nTrailBlazer Team`
        );
        console.log('Approval email sent to:', user.email);  // Debug: log that the email was sent

        // Send in-app notification
        await sendNotification(
            user._id,
            'system_alert',
            '',
            'Mountain Owner Approval',
            'You have been approved as a Mountain Owner!'
        );
        console.log('In-app notification sent to userId:', user._id);  // Debug: log that the notification was sent

        // Send successful response
        res.json({ message: 'User promoted to Mountain Owner and notified' });
        console.log('Response sent: User promoted and notified');  // Debug: log response sent

    } catch (error) {
        console.error('Error in approveMountainOwner:', error);  // Debug: log error
        res.status(500).json({ message: 'Server error' });
    }
};



// Approve a Mountain Owner 
exports.demoteMountainOwner = async (req, res) => {
    try {
        // Find the user by their ID (from the request parameters)
        const user = await User.findById(req.params.userId);
        
        // If the user is not found, return a 404 status with an error message
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the user is found, change their role to "user"
        user.role = 'user';

        // Save the updated user information to the database
        await user.save();

        // Send an email notification about the demotion
        await sendEmail(
            user.email,
            'Mountain Owner Demotion',
            `Hello ${user.firstName},\n\nUnfortunately, You have been demoted as a Mountain Owner. You now no longer have access to additional features within the TrailBlazer app.\n\nRegards,\nTrailBlazer Team`
        );

        // Send an in-app notification about the demotion
        await sendNotification(
            user._id,
            'system_alert',
            '',
            'Mountain Owner Demotion',
            'You have been demoted from being a Mountain Owner!'
        );

        // Return a success response
        res.json({ message: 'User demoted from Mountain Owner and notified' });
    } catch (error) {
        // Log and return a 500 server error if something goes wrong
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


      
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.suspended) {
      return res.status(400).json({ message: "User is already suspended" });
    }

    user.suspended = true;
    await user.save();

    // Send suspension email
    await sendEmail(
      user.email,
      "Account Suspended",
      `Hello ${user.firstName},\n\nYour account has been suspended by the admin. If you believe this was a mistake, please contact support.\n\nRegards,\nTrailBlazer Team`
    );

    res.json({ message: "User suspended and notified via email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unsuspend a User
exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.suspended) {
      return res.status(400).json({ message: "User is not suspended" });
    }

    user.suspended = false;
    await user.save();

    // Send unsuspension email
    await sendEmail(
      user.email,
      "Account Restored",
      `Hello ${user.firstName},\n\nYour account has been restored. You may now log in again.\n\nRegards,\nTrailBlazer Team`
    );

    res.json({ message: "User unsuspended and notified via email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a User Account
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all posts by the user
    await Post.deleteMany({ user: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    // Delete related reports
    await Report.deleteMany({ reportedBy: user._id });

    // Notify user via email
    await sendEmail(
      user.email,
      "Account Deleted",
      `Hello ${user.firstName},\n\nYour account has been permanently deleted due to repeated violations. If this was a mistake, please contact support.\n\nRegards,\nTrailBlazer Team`
    );

    res
      .status(200)
      .json({ message: "User account and all associated posts deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all reported posts (Admin only)
exports.getReportedPosts = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("post", "textContent route performance")
      .populate("reportedBy", "username");

    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//delete post fopr admins
exports.adminDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted by admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin action: Ignore, Delete Post, Suspend/Delete User
exports.adminActionOnReport = async (req, res) => {
  try {
    const { reportId, action } = req.body; // action = 'ignore', 'delete_post', 'suspend_user', 'delete_user'

    const report = await Report.findById(reportId).populate("post");
    if (!report) return res.status(404).json({ message: "Report not found" });

    const post = await Post.findById(report.post._id);
    const user = await User.findById(post.user);

    if (action === "ignore") {
      await report.delete();
      return res.status(200).json({ message: "Report ignored" });
    }

    if (action === "delete_post") {
      await exports.adminDeletePost({ params: { postId: post._id } }, res); // Call the admin delete function
      await report.delete();
      return;
    }

    if (action === "suspend_user") {
      await exports.suspendUser({ params: { userId: user._id } }, res); // Use existing function
      return;
    }

    if (action === "delete_user") {
      await exports.deleteUser({ params: { userId: user._id } }, res); // Use existing function
      return;
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all pending mountain requests
exports.getMountainRequests = async (req, res) => {
  try {
    const requests = await MountainRequest.find({ status: "pending" });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching mountain requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a specific mountain request by ID
exports.getMountainRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await MountainRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    // Convert stored arrays back to JSON format
    const formatJSON = (data) => JSON.stringify(data, null, 4); // Pretty print

    res.status(200).json({
      name: request.name,
      location: request.location,
      description: request.description,
      files: {
        geoJson: formatJSON(request.geoJson),
        trails: formatJSON(request.trails),
        pointsOfInterest: formatJSON(request.pointsOfInterest),
        chairlifts: formatJSON(request.chairlifts),
      },
      status: request.status,
      submittedAt: request.submittedAt,
    });
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.acceptMountainRequest = async (req, res) => {
  try {
    const request = await MountainRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Generate the next available mountain ID
    const lastMountain = await Mountain.findOne().sort({ mountainID: -1 });
    const newMountainID = lastMountain ? lastMountain.mountainID + 1 : 1;

    // Create a new Mountain entry
    const createdMountain = await createMountain(request, newMountainID);

    // Process and integrate POIs (pointsOfInterest)
    if (request.pointsOfInterest && Array.isArray(request.pointsOfInterest)) {
      for (const poiGroup of request.pointsOfInterest) {
        if (poiGroup.pois && Array.isArray(poiGroup.pois)) {
          // Iterate over each POI in the pois array
          for (const poi of poiGroup.pois) {
            // Validate that POI has the necessary fields
            if (!poi.type || !poi.POI_name || !poi.POI_id) {
              console.error("Invalid POI data:", poi);
              continue; // Skip this POI if validation fails
            }

            // Create and save POI
            const newPOI = new PointOfInterest({
              mountainID: newMountainID,
              POI_id: poi.POI_id,
              POI_name: poi.POI_name,
              type: poi.type,
            });

            await newPOI.save();
            console.log("POI saved successfully:", newPOI);
          }
        }
      }
    }

    // Respond with success message
    res
      .status(200)
      .json({ message: "Mountain request accepted and POIs integrated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deny a mountain request
exports.denyMountainRequest = async (req, res) => {
  try {
    const request = await MountainRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    await MountainRequest.findByIdAndDelete(req.params.id);

    // Notify user
    await sendNotification(
      request.ownerId,
      "system_alert",
      "",
      "Mountain Request Denied",
      `Unfortunately, your request for ${request.mountainName} has been denied.`
    );

    // Send email
    await sendEmail(
      request.ownerEmail,
      "Mountain Request Denied",
      `Unfortunately, your request for ${request.mountainName} has been denied.`
    );

    res
      .status(200)
      .json({ message: "Mountain request denied and deleted successfully." });
  } catch (error) {
    console.error("Error denying request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////Functions to create new mountain/////////////////////////////////////////////

// Helper function to create a new mountain
const createMountain = async (request, mountainId) => {
  const newMountain = new Mountain({
    mountainID: mountainId,
    name: request.name,
    location: request.location,
    description: request.description,
  });

  return await newMountain.save();
};

// Helper function to append mountainID and save related data
const appendMountainIdToData = async (request, mountainId) => {
  const PointOfInterest = require("../models/PointOfInterest");
  const Chairlift = require("../models/Chairlift");
  const Trail = require("../models/Trail");

  // Append mountainID to POIs
  if (request.pointsOfInterest && request.pointsOfInterest.length > 0) {
    const updatedPOIs = request.pointsOfInterest.map((poi) => ({
      ...poi,
      mountainID: mountainId,
    }));
    await PointOfInterest.insertMany(updatedPOIs);
  }

  // Append mountainID to Chairlifts
  if (request.chairlifts && request.chairlifts.length > 0) {
    const updatedChairlifts = request.chairlifts.map((lift) => ({
      ...lift,
      mountainID: mountainId,
    }));
    await Chairlift.insertMany(updatedChairlifts);
  }

  // Append mountainID to Trails
  if (request.trails && request.trails.length > 0) {
    const updatedTrails = request.trails.map((trail) => ({
      ...trail,
      mountainID: mountainId,
    }));
    await Trail.insertMany(updatedTrails);
  }
};

const createPointOfInterest = async (poi, mountainID) => {
  try {
    // Find the latest POI_id in the collection
    const lastPOI = await PointOfInterest.findOne().sort({ POI_id: -1 });
    const newPOI_id = lastPOI ? lastPOI.POI_id + 1 : 1; // Start from 1 if no POIs exist

    // Create and save the new POI with the unique POI_id
    const pointOfInterest = new PointOfInterest({
      type: poi.type,
      POI_name: poi.POI_name,
      POI_id: newPOI_id, // Use the new unique POI_id
      mountainID: mountainID, // Associate POI with the new mountain
    });

    await pointOfInterest.save();
    console.log("POI saved successfully:", pointOfInterest);
  } catch (error) {
    console.error("Error saving POI:", error);
    throw new Error("Error saving POI");
  }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        
        //console.log("Entered try block");
        //console.log("Received search query:", query);
        
        if (!query) {
            console.log("Query missing, sending 400 response");
            return res.status(400).json({ message: "Search query is required." });
        }

        // Fetch users from the database
        //console.log("Fetching users from the database...");
        const users = await User.find().select("username firstName lastName _id role");

        //console.log("Fetched users from DB:", users.length);
        if (users.length === 0) {
            console.log("No users found in the database.");
        }

        // Initialize Fuse.js for searching
        const fuse = new Fuse(users, {
            keys: ["username", "firstName", "lastName"],
            threshold: 0.3,
            includeScore: true,
        });

        console.log("Fuse.js search initialized with options:", {
            keys: ["username", "firstName", "lastName"],
            threshold: 0.3
        });

        // Perform the search
        //console.log("Performing search for query:", query);
        const results = fuse.search(query);

        //console.log("Fuse.js search completed.");
        console.log("Number of results found:", results.length);

        // Mapping results
        const matchedUsers = results.map(result => result.item);

        console.log("Matched users:", matchedUsers);

        // Return matched users
        res.status(200).json(matchedUsers);
    } catch (error) {
        console.error("Error in searchUsers:", error);
        res.status(500).json({ message: "Server error.", error: error.toString() });
    }
};



//get user role type by id 
exports.getUserRole = async (req, res) => {
    try {
        const userId = req.user.userID;
        console.log(' Request to get user role received');

        // Check if userId is set in the auth middleware
        
        console.log(' Decoded userId:', userId);

        if (!userId) {
            console.log('No userId found in request');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find the user by ID
        const user = await User.findOne({userID: userId});
        if (!user) {
            console.log(' User not found for userId:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User found:', user);

        // Return the user's role
        res.status(200).json({ role: user.role });
        console.log('User role sent:', user.role);
    } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Retrieve all posts in the database


