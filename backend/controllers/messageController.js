const Message = require('../models/Message');

const getMessages = async (req, res) => {
    try {
        const { contactId } = req.params;
        const myId = req.user._id;

        // Find messages where I am the sender and the contact is the receiver
        // OR where the contact is the sender and I am the receiver.
        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: contactId }, // Show my messages (including scheduled)
                { sender: contactId, receiver: myId, isScheduled: { $ne: true } } // Show their messages ONLY if they are NOT scheduled
            ]
        }).sort({ createdAt: 1 }); // Sort chronologically (oldest to newest)

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const scheduleMessage = async (req, res) => {
    try {
        const { receiverId, text, iv, scheduledFor } = req.body;
        
        if (!receiverId || !text || !iv || !scheduledFor) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            encryptedContent: text,
            iv,
            isScheduled: true,
            scheduledFor: new Date(scheduledFor)
        });

        res.status(201).json(message);
    } catch (err) {
        console.error("Failed to schedule message:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getMessages,
    scheduleMessage
};
