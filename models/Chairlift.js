const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Chairlift schema
const chairliftSchema = new Schema({
  liftID: { type: Number, required: true, unique: true },
  liftName: { type: String, required: true },
  topTrails: [{ type: Number, ref: 'BlueMountainTrail' }], // References to runIDs of trails starting at the top
  bottomPOI: { type: Number, ref: 'PointOfInterest', required: false } // Reference to POI_id of the bottom POI
});

// Create a model from the schema
const Chairlift = mongoose.model('Chairlift', chairliftSchema);

module.exports = Chairlift;
