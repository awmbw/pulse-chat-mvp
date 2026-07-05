const cron = require('node-cron');
const Message = require('../models/Message');

module.exports = function (io) {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find all pending scheduled messages that are due
            const dueMessages = await Message.find({
                isScheduled: true,
                scheduledFor: { $lte: now }
            });

            if (dueMessages.length > 0) {
                console.log(`Cron: Found ${dueMessages.length} scheduled message(s) to send.`);
            }

            for (const msg of dueMessages) {
                // Generate a room ID by sorting sender and receiver
                const room = [msg.sender.toString(), msg.receiver.toString()].sort().join('_');
                
                // Emit to the receiver's room
                io.to(room).emit('receive_message', {
                    senderId: msg.sender.toString(),
                    receiverId: msg.receiver.toString(),
                    text: msg.encryptedContent,
                    iv: msg.iv,
                    room
                });

                // Mark as sent so we don't send it again
                msg.isScheduled = false;
                await msg.save();
            }
        } catch (err) {
            console.error('Error in Scheduled Message Cron Job:', err);
        }
    });
};
