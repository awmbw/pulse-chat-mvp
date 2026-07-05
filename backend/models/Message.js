const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    encryptedContent: {
        type: String,
        required: true
    },
    iv: {
        type: String,
        required: true
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    scheduledFor: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
