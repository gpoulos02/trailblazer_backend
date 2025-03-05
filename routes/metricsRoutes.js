const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/metrics - Save a ski session
router.post("/", authMiddleware, metricsController.saveSession);

// GET /api/metrics/dates - Get a list of session dates
router.get("/dates", authMiddleware, metricsController.getSessionDates);

// GET /api/metrics/overview - Get an overview of metrics over a specified period
router.get("/overview", authMiddleware, metricsController.getMetricOverview);

// GET /api/metrics/:id - Get session data for a specific session
router.get("/session/:id", authMiddleware, metricsController.getSessionById);

// DELETE /api/metrics/:id - Delete a specific session
router.delete("/:id", authMiddleware, metricsController.deleteSession);

// get all metrics for specific by runID
router.get("/runID/:runID", authMiddleware, metricsController.getRunsByRunID);

// get all metrics for specific by date
router.get("/date", authMiddleware, metricsController.getRunsByDate);

// GET /api/metrics/speed - Get all runs sorted by top speed (fastest to slowest)
router.get("/speed", authMiddleware, metricsController.getRunsSortedBySpeed);

router.get("/all", authMiddleware, metricsController.getAllMetrics);

//get all metrics for particular user
router.get("/metrics", metricsController.getMetricsByUserId);

// get average difficulty fort day
router.get(
  "/average-difficulty",
  authMiddleware,
  metricsController.getAverageDifficulty
);

module.exports = router;
