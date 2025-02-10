const mongoose = require('mongoose');

const mountainRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { 
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    description: { type: String, required: true },
    geoJson: { type: Object, required: true }, // GeoJSON data for mapping
    trails: { type: Array, required: true }, // Array of trails as per schema
    pointsOfInterest: { type: Array, required: true }, // Array of POIs
    chairlifts: { type: Array, required: true }, // Array of chairlifts
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Owner ID
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Approval status
    submittedAt: { type: Date, default: Date.now } // Timestamp
});

module.exports = mongoose.model('MountainRequest', mountainRequestSchema);
