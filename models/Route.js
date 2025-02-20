const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import uuid package

// You can use the uuidv4 function to generate routeID
const routeSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    routeID: {
        type: String,
        default: uuidv4, // Automatically generate a UUID for routeID
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    trails: [{
        type: Number, // Storing ObjectIds of BlueMountainTrail models
        ref: 'BlueMountainTrail', 
        required: true,
    }], 
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Route', routeSchema);
