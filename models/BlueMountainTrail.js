const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Trail schema
const trailSchema = new Schema({
  runID: { type: Number, required: true, unique: true },
  runName: { type: String, required: true },
  difficulty: { type: String, enum: ['Green', 'Blue', 'Black', 'Double Black'], required: true },
  runLength: { type: Number, required: true },  // Length in meters
  destinations: [{ type: Schema.Types.ObjectId, ref: 'PointOfInterest' }],  // Refers to POIs
  coordinates: {
    long: { type: Number, required: true }, // Longitude
    lat: { type: Number, required: true }   // Latitude
  }
});

// Create a model from the schema
const BlueMountainTrail = mongoose.model('BlueMountainTrail', trailSchema);

module.exports = BlueMountainTrail;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Trail schema
const trailSchema = new Schema({
  runID: { type: Number, required: true, unique: true },
  runName: { type: String, required: true },
  difficulty: { type: String, enum: ['Green', 'Blue', 'Black', 'Double Black'], required: true },
  runLength: { type: Number, required: true },  // Length in meters
  destinations: [{ type: Schema.Types.ObjectId, ref: 'PointOfInterest' }],  // Refers to POIs
  coordinates: {
    long: { type: Number, required: true }, // Longitude
    lat: { type: Number, required: true }   // Latitude
  }
});

// Create a model from the schema
const BlueMountainTrail = mongoose.model('BlueMountainTrail', trailSchema);

module.exports = BlueMountainTrail;
