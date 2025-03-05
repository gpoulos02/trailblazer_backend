const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mountainSchema = new Schema({
  name: { type: String, required: true, unique: true },
  mountainID: {type: Number, required: true},
  location: { 
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  description: { type: String },
});

const Mountain = mongoose.model('Mountain', mountainSchema);
module.exports = Mountain;
