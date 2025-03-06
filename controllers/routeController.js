const mongoose = require("mongoose");
const Trail = require("../models/Trail");
const Chairlift = require("../models/Chairlift");
const PointOfInterest = require("../models/PointOfInterest");
const Route = require("../models/Route");
const User = require("../models/User"); // Ensure you have User model imported
const { v4: uuidv4 } = require("uuid");
// const Route = require('../models/Route');

exports.findRoutes = async (req, res) => {
  try {
    const { chairliftName, maxDifficulty, destination, mountainID } = req.body;

    console.log("Request received with parameters:", {
      chairliftName,
      maxDifficulty,
      destination,
      mountainID,
    });

    // Validate mandatory parameters
    if (!chairliftName || !maxDifficulty || mountainID === undefined) {
      return res.status(400).json({
        message: "chairliftName, maxDifficulty, and mountainID are required.",
      });
    }

    // Find the chairlift by name
    console.log(`Searching for chairlift with name: ${chairliftName}`);
    const chairlift = await Chairlift.findOne({
      liftName: chairliftName,
      mountainID,
    }).populate({
      path: "topTrails",
      model: "Trail",
      localField: "topTrails",
      foreignField: "runID",
      options: { select: "runID runName difficulty" },
    });

    if (!chairlift || !chairlift.topTrails.length) {
      console.warn(
        `No trails found for the given chairlift name: ${chairliftName}`
      );
      return res
        .status(404)
        .json({ message: "No trails found for the given chairlift name." });
    }

    console.log(
      `Chairlift found: ${chairlift.liftName}, Top trails: ${chairlift.topTrails.length}`
    );

    // Difficulty mapping for filtering
    const allowedDifficulties = {
      green: ["green"],
      blue: ["green", "blue"],
      black: ["green", "blue", "black"],
      "double black": ["green", "blue", "black", "double black"],
    };

    const validDifficulties = allowedDifficulties[maxDifficulty.toLowerCase()];
    if (!validDifficulties) {
      console.error(`Invalid maxDifficulty value provided: ${maxDifficulty}`);
      return res.status(400).json({ message: "Invalid maxDifficulty value." });
    }

    console.log(
      `Valid difficulties based on maxDifficulty (${maxDifficulty}):`,
      validDifficulties
    );

    const routes = [];
    const visited = new Set();

    const traverse = async (trailObj, currentPath) => {
      const trailRunID = trailObj.runID;

      if (visited.has(trailRunID)) {
        console.debug(`Skipping already visited trail: ${trailRunID}`);
        return; // Prevent infinite loops
      }
      visited.add(trailRunID);

      console.log(`Visiting trail: ${trailRunID}`);

      // Find the current trail in the database and populate its relationships
      const trail = await Trail.findOne({ runID: trailRunID, mountainID })
        .populate({
          path: "childTrails",
          model: "Trail",
          localField: "childTrails",
          foreignField: "runID",
          options: { select: "runID runName difficulty" },
        })
        .populate({
          path: "endingPoints",
          model: "PointOfInterest",
          localField: "endingPoints",
          foreignField: "POI_id",
          options: { select: "POI_id POI_name type" },
        });

      if (!trail) {
        console.error(
          `Trail with runID ${trailRunID} not found in the database.`
        );
        return;
      }

      console.log(
        `Trail found: ${trail.runName}, Difficulty: ${trail.difficulty}`
      );

      if (!validDifficulties.includes(trail.difficulty)) {
        console.debug(
          `Skipping trail due to difficulty filter: ${trail.difficulty}`
        );
        return;
      }

      // Add the current trail as a standalone route if it's an end trail
      if (
        trail.isEnd ||
        (destination &&
          trail.endingPoints.some((point) => point.POI_id === destination))
      ) {
        console.log(`Adding end trail to routes: ${trail.runName}`);
        routes.push([...currentPath, trail]);
      }

      // Recursively traverse child trails
      for (const childTrail of trail.childTrails) {
        if (childTrail && childTrail.runID) {
          console.log(`Branching to child trail: ${childTrail.runID}`);
          await traverse(childTrail, [...currentPath, trail]); // Pass the updated path
        } else {
          console.warn(
            "Invalid childTrail found during traversal:",
            childTrail
          );
        }
      }
    };

    // Start traversal from each trail at the chairlift
    for (const trailObj of chairlift.topTrails) {
      console.log(`Starting traversal for trail: ${trailObj.runID}`);
      await traverse(trailObj, []); // Assuming `chairlift.topTrails` contains trail objects
    }

    // Respond with the found routes
    if (routes.length === 0) {
      console.warn("No suitable routes found after traversal.");
      return res.status(404).json({ message: "No suitable routes found." });
    }

    console.log(`Routes found: ${routes.length}`);
    res.json(
      routes.map((route) =>
        route.map((trail) => ({
          runID: trail.runID,
          runName: trail.runName,
          difficulty: trail.difficulty,
        }))
      )
    );
  } catch (error) {
    console.error("Error finding routes:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Save a route

exports.saveRoute = async (req, res) => {
  try {
    const { name, trails, mountainID } = req.body;

    if (!name || !trails || !trails.length || mountainID === undefined) {
      return res
        .status(400)
        .json({ message: "Route name, trails, and mountainID are required." });
    }

    // Find user by `userID` (UUID) and get MongoDB `_id`
    const user = await User.findOne({ userID: req.user.userID }).select("_id");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure all `trails` are valid `runID`s
    const validTrailIDs = await Trail.find({
      runID: { $in: trails },
      mountainID,
    }).distinct("runID");

    if (validTrailIDs.length !== trails.length) {
      return res.status(400).json({
        message: "Some trails were not found for the given mountainID.",
      });
    }

    // Create new route with runID references instead of `_id`
    const route = new Route({
      user: user._id,
      name,
      trails: validTrailIDs,
      mountainID,
    });

    await route.save();
    res.status(201).json({ message: "Route saved successfully.", route });
  } catch (error) {
    console.error("Error saving route:", error);
    res.status(500).json({ message: "Server error while saving route." });
  }
};

// Load all saved routes for the user
exports.getUserRoutes = async (req, res) => {
  try {
    // Find the user by `userID` (UUID) and get MongoDB `_id`
    const user = await User.findOne({ userID: req.user.userID }).select("_id");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Query routes using MongoDB `_id`
    const routes = await Route.find({ user: user._id }).populate("trails");

    if (!routes.length) {
      return res.status(404).json({ message: "No saved routes found." });
    }

    res.json(routes);
  } catch (error) {
    console.error("Error fetching user routes:", error);
    res.status(500).json({ message: "Server error while fetching routes." });
  }
};

// Delete a saved route
exports.deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    // Validate routeId format
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ message: "Invalid route ID format." });
    }

    // Find user in MongoDB (ensure we have correct ObjectId)
    const user = await User.findOne({ userID: req.user.userID }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the route and ensure the user owns it
    const route = await Route.findOne({ _id: routeId, user: user._id });
    if (!route) {
      return res.status(404).json({
        message: "Route not found or you do not have permission to delete it.",
      });
    }

    // Delete the route
    await Route.findByIdAndDelete(routeId);
    res.json({ message: "Route deleted successfully." });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ message: "Server error while deleting route." });
  }
};

exports.getRunNameByRunID = async (req, res) => {
  console.log("Made it to the getRunNameByRunID controller");

  try {
    let { runID } = req.query; // Get runID from query parameter
    console.log("RunID from query:", runID);

    if (!runID) {
      console.log("runID is missing in the request");
      return res.status(400).json({ message: "runID is required" });
    }

    // Convert runID to a number for query
    runID = Number(runID);
    console.log("Converted runID to number:", runID);

    // Check if the conversion was successful
    if (isNaN(runID)) {
      console.log("Invalid runID format, not a number");
      return res.status(400).json({ message: "Invalid runID format" });
    }

    // Find the trail by runID
    const trail = await Trail.findOne({ runID });

    if (!trail) {
      console.log(`No trail found for runID: ${runID}`);
      return res
        .status(404)
        .json({ message: "Trail not found for the provided runID" });
    }

    console.log("Trail found:", trail);
    // Return the runName (or trail name) from the BlueMountainTrail model
    res.json({ runName: String(trail.runName) });
  } catch (error) {
    console.error("Error fetching run name:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRunIDByRunName = async (req, res) => {
  try {
    const { runName } = req.query; // Get runName from the query string

    if (!runName) {
      return res.status(400).json({ message: "runName is required" });
    }

    // Fetch the trail by runName
    const trail = await Trail.findOne({ runName });

    if (!trail) {
      return res.status(404).json({ message: "Trail not found" });
    }

    // Respond with the runID
    res.json({ runID: String(trail.runID) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get all route names
exports.getRouteNames = async (req, res) => {
  try {
    // Fetch all trails, returning only the 'runName' field
    const trails = await Trail.find({}, "runName"); // This queries the 'runName' field
    //console.log("Fetched trails:", trails); // Debugging: Log the fetched trails

    // If no trails are found, return an empty array with a message
    if (trails.length === 0) {
      console.log("No routes found in the database."); // Debugging: Log if no routes are found
      return res.status(404).json({ message: "No routes found", routes: [] });
    }

    // Respond with the trail names in the expected format
    const trailNames = trails.map((trail) => trail.runName);
    //console.log("Trail names to return:", trailNames); // Debugging: Log the names that will be returned

    res.status(200).json({
      message: "Route names retrieved successfully",
      routes: trailNames, // Extract the runName from each trail document
    });
  } catch (error) {
    console.error("Error retrieving route names:", error); // Debugging: Log the error
    res
      .status(500)
      .json({ message: "Error retrieving route names", error: error.message });
  }
};

module.exports = exports;
