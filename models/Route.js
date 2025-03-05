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
    mountainID: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    trails: [{ type: Number, required: true }], // ✅ Store runIDs instead of ObjectId
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
