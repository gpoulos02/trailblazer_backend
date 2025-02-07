const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chairliftSchema = new Schema({
  mountainID: { type: Number, required: true },
  liftID: { type: Number, required: true, unique: true },
  liftName: { type: String, required: true },
  topTrails: [{ type: Number, ref: 'Trail' }], 
  bottomPOI: { type: Number, ref: 'PointOfInterest', required: false } 
});

const Chairlift = mongoose.model('Chairlift', chairliftSchema);
module.exports = Chairlift;
