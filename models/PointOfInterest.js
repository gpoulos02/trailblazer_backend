const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Points of Interest schema
const pointOfInterestSchema = new Schema({
  POI_id: { type: Number, required: true, unique: true },
  POI_name: { type: String, required: true },
  POI_coordinates: {
    long: { type: Number, required: true }, // Longitude
    lat: { type: Number, required: true }   // Latitude
  },
  associatedHills: [{ type: Schema.Types.ObjectId, ref: 'BlueMountainTrail' }]  // Refers to Trails
});

// Create a model from the schema
const PointOfInterest = mongoose.model('PointOfInterest', pointOfInterestSchema);

module.exports = PointOfInterest;
