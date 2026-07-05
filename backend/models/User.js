const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    publicKey: {
        type: String,
        required: true
    },
    preferredLanguage: {
        type: String,
        default: 'en'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
