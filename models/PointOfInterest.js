const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointOfInterestSchema = new Schema({
  mountainID: { type: Number, required: true },
  POI_id: { type: Number, required: true, unique: true },
  POI_name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['lodging', 'parking lot', 'other', 'chairlift', 'restaurant'], 
    required: true 
  }
});

const PointOfInterest = mongoose.model('PointOfInterest', pointOfInterestSchema);
module.exports = PointOfInterest;
