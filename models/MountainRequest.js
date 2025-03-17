const mongoose = require("mongoose");

const mountainRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  description: { type: String, required: true },
  trails: { type: Array, required: true },
  pointsOfInterest: { type: Array, required: true },
  chairlifts: { type: Array, required: true },
  submittedBy: { type: String, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MountainRequest", mountainRequestSchema);