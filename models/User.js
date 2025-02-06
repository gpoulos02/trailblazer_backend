const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    userID: {
        type: String,
        required: true,
        unique: true,
    },
    bio: {   
        type: String,
        default: '', 
    },
    friends: [{
        type: String,
        ref: 'User'
    }],
    friendRequestsSent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequestsReceived: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    role: {
        type: String,
        enum: ['user', 'admin', 'mountain_owner'], 
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', userSchema);
