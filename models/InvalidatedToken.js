const mongoose = require('mongoose');

const InvalidatedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    invalidatedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('InvalidatedToken', InvalidatedTokenSchema);
