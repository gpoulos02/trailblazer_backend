const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Trail schema
const trailSchema = new Schema({
  runID: { type: Number, required: true, unique: true },
  runName: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['Green', 'Blue', 'Black', 'Double Black'], 
    required: true 
  },
  startingPoints: [
    {
      chairlifts: [{ type: Schema.Types.ObjectId, ref: 'PointOfInterest' }], // Chairlifts going into it
      runs: [{ type: Number }] // runIDs connecting to this starting point
    }
  ],
  endingPoints: [
    {
      type: {
        type: String,
        enum: ['Lodging', 'Parking Lot', 'Other', 'Chairlift', 'Restaurant', 'Run'],
        required: true
      },
      POI_id: { type: Number, required: true } // Reference to the point of interest's ID
    }
  ],
  coordinates: {
    long: { type: Number, required: true }, // Longitude
    lat: { type: Number, required: true }   // Latitude
  }
});

// Create a model from the schema
const BlueMountainTrail = mongoose.model('BlueMountainTrail', trailSchema);

module.exports = BlueMountainTrail;
