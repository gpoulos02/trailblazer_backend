const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import uuid package

// You can use the uuidv4 function to generate routeID
const routeSchema = new mongoose.Schema({
    mountainID: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    trails: [{ type: Number, required: true }], 
    createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Route', routeSchema);
