const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Trail schema
const trailSchema = new Schema({
  runID: { type: Number, required: true, unique: true },
  runName: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['green', 'blue', 'black', 'double black'], 
    required: true 
  },
  startingLift: { type: Number, required: true, ref: 'Chairlift' }, // Reference to liftID of the starting lift
  parentTrail: { type: Number, ref: 'BlueMountainTrail' }, // Reference to runID of the parent trail (optional)
  childTrails: [{ type: Number, ref: 'BlueMountainTrail' }], // References to runIDs of child trails
  endingPoints: [{ type: Number, ref: 'PointOfInterest' }], // References to POI_ids for the ending points
  isEnd: { type: Boolean, required: true},
  mergesTo: {type: Number, ref: 'BlueMountainTrail'}

});

// Create a model from the schema
const BlueMountainTrail = mongoose.model('BlueMountainTrail', trailSchema);

module.exports = BlueMountainTrail;
