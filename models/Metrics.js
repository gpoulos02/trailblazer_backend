const mongoose = require('mongoose');

const metricsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sessionData: {
        aveSpeed: {
            type: Number,
            required: true,
        },
        topSpeed: {
            type: Number,
            required: true,
        },
        distance: {
            type: Number,
            required: true,
        },
        elevationGain: {
            type: Number,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Metrics', metricsSchema);
