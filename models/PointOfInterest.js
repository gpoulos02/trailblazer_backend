const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Points of Interest schema
const pointOfInterestSchema = new Schema({
  POI_id: { type: Number, required: true, unique: true },
  POI_name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['lodging', 'parking lot', 'other', 'chairlift', 'restaurant'], 
    required: true 
  } // POI type (lodging, parking lot, chairlift, etc.)
});

// Create a model from the schema
const PointOfInterest = mongoose.model('PointOfInterest', pointOfInterestSchema);

module.exports = PointOfInterest;
