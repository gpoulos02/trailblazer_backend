const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trailSchema = new Schema({
  mountainID: { type: Number, required: true },
  runID: { type: Number, required: true, unique: true },
  runName: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['green', 'blue', 'black', 'double black'], 
    required: true 
  },
  startingLift: { type: Number, required: true, ref: 'Chairlift' }, 
  parentTrail: { type: Number, ref: 'Trail' },
  childTrails: [{ type: Number, ref: 'Trail' }],
  endingPoints: [{ type: Number, ref: 'PointOfInterest' }],
  isEnd: { type: Boolean, required: true },
  mergesTo: [{ type: Number, ref: 'Trail' }]
});

const Trail = mongoose.model('Trail', trailSchema);
module.exports = Trail;
