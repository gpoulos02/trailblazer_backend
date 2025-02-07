const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
    userID: {
        type: String, // Using userID as a string
        required: true,
    },
    mountainID: {
        type: Number,
        required: true
    },
    runID: {
        type: Number, // Run ID of the ski trail
        required: true,
    },
    sessionData: {
        topSpeed: { type: Number, required: true },
        distance: { type: Number, required: true },
        elevationGain: { type: Number, required: true },
        duration: { type: Number, required: true },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Metrics = mongoose.model('Metrics', metricsSchema);
module.exports = Metrics;
