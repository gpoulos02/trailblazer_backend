const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
    location: {
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    temperature: {
        type: Number,
        required: true,
    },
    condition: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Weather', weatherSchema);
