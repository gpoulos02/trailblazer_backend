const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['text', 'route', 'performance'], 
        required: true 
    },
    textContent: { type: String, required: function() { return this.type === 'text'; } },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: function() { return this.type === 'route'; } },
    performance: { type: mongoose.Schema.Types.ObjectId, ref: 'Metrics', required: function() { return this.type === 'performance'; } },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    title: {type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
