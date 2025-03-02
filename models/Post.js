const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const postSchema = new mongoose.Schema({
    postID: { type: String, default: uuidv4, unique: true, required: true }, 
    userID: { type: String, ref: 'User', required: true }, // Store userID as a String
    type: { 
        type: String, 
        enum: ['text', 'route', 'performance'], 
        required: true 
    },
    textContent: { type: String, required: function() { return this.type === 'text'; } },
    routeID: { type: String, ref: 'Route', required: function() { return this.type === 'route'; } },
    sessionID: { type: String, ref: 'Metrics', required: function() { return this.type === 'performance'; } },
    likes: [{ type: String}], // Store likes using userID (String)
    comments: [{
        user: { type: String, ref: 'User', required: true }, // Store userID as String
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
