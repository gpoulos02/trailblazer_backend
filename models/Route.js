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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlueMountainTrail',
        required: true,
    }], // Array of trail IDs representing the route
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Route', routeSchema);
