const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    elevation: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const routeSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    trails: [{
        type: Number,
        ref: 'BlueMountainTrail', // Reference by runID instead of ObjectId
        required: true,
    }], // Array of runIDs representing the route
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Route', routeSchema);
