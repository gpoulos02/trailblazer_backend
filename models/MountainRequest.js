const mongoose = require('mongoose');

const mountainRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { 
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    description: { type: String, required: true },
    geoJson: { type: Object, required: true }, // Store parsed GeoJSON
    trails: { type: Array, required: true }, // Store parsed trails data
    pointsOfInterest: { type: Array, required: true }, // Store parsed POIs
    chairlifts: { type: Array, required: true }, // Store parsed chairlifts
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MountainRequest', mountainRequestSchema);
