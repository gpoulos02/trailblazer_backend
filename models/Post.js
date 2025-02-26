const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userID: { type: String, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['text', 'route', 'performance'], 
        required: true 
    },
    textContent: { type: String, required: function() { return this.type === 'text'; } },
    routeID: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: function() { return this.type === 'route'; } },
    sessionID: { type: String, ref: 'Metrics', required: function() { return this.type === 'performance'; } },
    likes: [{ type: String, ref: 'User' }],
    comments: [{
        user: { type: String, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
