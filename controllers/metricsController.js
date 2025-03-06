const Metrics = require("../models/Metrics");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const Trail = require("../models/Trail"); // Import the trail model

exports.saveSession = async (req, res) => {
  try {
    const { sessionData, runID } = req.body;

    if (
      !sessionData.topSpeed ||
      !sessionData.distance ||
      !sessionData.elevationGain ||
      !sessionData.duration ||
      !runID
    ) {
      return res
        .status(400)
        .json({ message: "All session data fields and runID are required" });
    }

    const userID = req.user.userID;
    if (!userID) {
      return res
        .status(400)
        .json({ message: "User not authenticated or userID missing" });
    }

    // Validate that the mountain exists
    const mountainExists = await Mountain.findOne({ mountainID });
    if (!mountainExists) {
      return res.status(404).json({ message: "Mountain not found" });
    }

    // Create a new sessionID for each save (uuid)
    const sessionID = uuidv4();

    const metrics = new Metrics({
      sessionID, // Include the unique sessionID here
      userID,
      runID,
      sessionData,
      createdAt: new Date(),
    });

    await metrics.save();
    res.status(201).json(metrics);
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSessionDates = async (req, res) => {
  try {
    const sessions = await Metrics.find({ userID: req.user.userID })
      .sort({ createdAt: -1 })
      .select("createdAt runID") // Include runID
      .exec();

    const sessionDates = sessions.map((session) => ({
      id: session.sessionID,
      date: session.createdAt,
      runID: session.runID, // Include runID in response
    }));

    res.json(sessionDates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update for `getSessionById`
exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Metrics.findOne({ sessionID: id }).select("-__v"); // Find by sessionID

    console.log("session: ", session);

    if (!session || session.userID !== req.user.userID) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      sessionID: session.sessionID, // Use sessionID instead of _id
      runID: session.runID, // Include runID
      sessionData: session.sessionData,
      createdAt: session.createdAt,
    });

    console.log("session details: ", session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the session by ID
    const session = await Metrics.findById(id);

    // Check if the session exists
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Ensure the authenticated user owns the session
    if (session.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Delete the session
    await Metrics.findByIdAndDelete(id);

    // Respond with success message
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server error" });
  }
};

//gets an overview of all metrics over a given period
exports.getMetricOverview = async (req, res) => {
  try {
    const metrics = await Metrics.find({ userID: req.user.userID });

    if (!metrics.length) {
      return res.status(404).json({ message: "No metrics found" });
    }

    const overview = metrics.map((metric) => ({
      id: metric._id,
      runID: metric.runID, // Include runID
      topSpeed: metric.sessionData.topSpeed,
      distance: metric.sessionData.distance,
      elevationGain: metric.sessionData.elevationGain,
      duration: metric.sessionData.duration,
      createdAt: metric.createdAt,
    }));

    res.json(overview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRunsByRunID = async (req, res) => {
  try {
    const { runID, mountainID } = req.params;

    const runs = await Metrics.find({
      runID,
      mountainID,
      userID: req.user.userID,
    });

    if (!runs.length) {
      return res
        .status(404)
        .json({ message: "No runs found for this runID and mountain." });
    }

    res.json(runs);
  } catch (error) {
    console.error("Error retrieving runs by runID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRunsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const userID = req.user.userID; // Get userID from the JWT

    // Fetch the runs for the logged-in user by the given date
    const runs = await Metrics.find({
      userID,
      createdAt: {
        $gte: new Date(date + "T00:00:00Z"),
        $lt: new Date(date + "T23:59:59Z"),
      },
    }).exec();

    if (!runs.length) {
      return res
        .status(404)
        .json({ message: "No runs found for this user on the given date" });
    }

    res.json(runs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRunsSortedBySpeed = async (req, res) => {
  try {
    const userID = req.user.userID; // Get userID from the JWT

    // Fetch the runs for the logged-in user and sort them by topSpeed
    const runs = await Metrics.find({ userID })
      .sort({ "sessionData.topSpeed": -1 })
      .exec();

    if (!runs.length) {
      return res.status(404).json({ message: "No runs found for this user" });
    }

    res.json(runs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all performance metrics for the logged-in user
exports.getAllMetrics = async (req, res) => {
  try {
    // Get the userID from the JWT token
    const userID = req.user.userID; // Assuming you have a middleware that decodes JWT and attaches the user object
    console.log("userID: ", userID); // Log userID for debugging

    // Fetch all performance metrics for the logged-in user
    const metrics = await Metrics.find({ userID }).exec();

    if (!metrics.length) {
      return res
        .status(404)
        .json({ message: "No metrics found for this user" });
    }

    res.json(metrics); // Send the metrics data as response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMetricsByUserId = async (req, res) => {
  try {
    const { userID } = req.user; // Extract userID from the middleware (req.user)
    console.log("User ID extracted:", userID); // Log the extracted userID // Ensure userID is a string (it could be passed as a string or an ObjectId, so we handle that here)
    const userIdString = String(userID);
    console.log("User ID as string:", userIdString); // Log the userID after converting to string // Find metrics for the given userID in the database
    const metrics = await Metrics.find({ userID: userID }); // Use string as the query filter

    console.log("Metrics fetched:", metrics); // Log the metrics found
    if (!metrics || metrics.length === 0) {
      console.log("No metrics found for user:", userIdString); // Log if no metrics are found
      return res
        .status(404)
        .json({ message: "No metrics found for this user" });
    } // Return the found metrics

    res.status(200).json(metrics);
  } catch (error) {
    console.error("Error occurred:", error); // Log the error details
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAverageDifficulty = async (req, res) => {
  try {
    const userID = req.user.userID; // Assuming user ID is sent in the request

    console.log("User ID:", userID); // Log the user ID for debugging

    if (!userID) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Define today's date range (midnight to 23:59:59)
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    console.log("Start of Day:", startOfDay); // Log start of day
    console.log("End of Day:", endOfDay); // Log end of day

    // Fetch all runs from today for the user
    const runs = await Metrics.find({
      userID: userID,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    console.log("Fetched Runs:", runs); // Log the fetched runs

    if (!runs.length) {
      return res.json({ averageDifficulty: 0 }); // Default to 0 if no runs today
    }

    // Fetch trail difficulty for each run from BlueMountainTrail
    const runDifficulties = await Promise.all(
      runs.map(async (run) => {
        const trail = await BlueMountainTrail.findOne({ runID: run.runID });
        if (trail) {
          console.log(
            `Run ID: ${run.runID} has Difficulty: ${trail.difficulty}`
          );
          return trail.difficulty;
        }
        console.log(`Run ID: ${run.runID} has no difficulty found.`);
        return null; // If no trail found for the runID, return null
      })
    );

    // Filter out any null difficulties (in case some runs don't have a corresponding trail)
    const validDifficulties = runDifficulties.filter(
      (difficulty) => difficulty !== null
    );

    if (validDifficulties.length === 0) {
      return res.json({ averageDifficulty: 0 }); // Default to 0 if no valid difficulties
    }

    // Calculate the average difficulty
    const difficultyScores = {
      green: 1,
      blue: 2,
      black: 3,
      "double black": 4,
    };

    const totalDifficulty = validDifficulties.reduce((sum, difficulty) => {
      return sum + (difficultyScores[difficulty] || 0); // Default to 0 if invalid difficulty
    }, 0);

    const averageDifficulty = totalDifficulty / validDifficulties.length;

    console.log("Total Difficulty:", totalDifficulty); // Log total difficulty
    console.log("Average Difficulty (before formatting):", averageDifficulty); // Log before rounding

    // Reverse the mapping to get difficulty from the score
    const difficultyLabels = {
      1: "Green",
      2: "Blue",
      3: "Black",
      4: "Double Black",
    };

    // Get the difficulty label corresponding to the average difficulty score
    let averageDifficultyLabel = "green"; // Default to "green" if something goes wrong
    if (averageDifficulty >= 1 && averageDifficulty <= 1.5) {
      averageDifficultyLabel = difficultyLabels[1]; // green
    } else if (averageDifficulty > 1.5 && averageDifficulty <= 2.5) {
      averageDifficultyLabel = difficultyLabels[2]; // blue
    } else if (averageDifficulty > 2.5 && averageDifficulty <= 3.5) {
      averageDifficultyLabel = difficultyLabels[3]; // black
    } else if (averageDifficulty > 3.5) {
      averageDifficultyLabel = difficultyLabels[4]; // double black
    }

    console.log("Average Difficulty (formatted):", averageDifficultyLabel); // Log the label

    res.json({ averageDifficulty: averageDifficultyLabel });
  } catch (error) {
    console.error("Error fetching average difficulty:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = exports;
