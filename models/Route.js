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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    waypoints: [waypointSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Route', routeSchema);
