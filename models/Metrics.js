const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import UUID

const metricsSchema = new mongoose.Schema({
    sessionID: {
        type: String,
        required: true,
        default: uuidv4, // Automatically generate a unique sessionID
    },
    userID: {
        type: String,
        required: true,
    },
    runID: {
        type: Number,
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
