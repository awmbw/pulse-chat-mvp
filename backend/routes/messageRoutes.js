const express = require('express');
const router = express.Router();
const { getMessages, scheduleMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/messages/:contactId
// @desc    Get chat history between logged in user and a specific contact
// @access  Private (Requires JWT Token)
router.get('/:contactId', protect, getMessages);
router.post('/schedule', protect, scheduleMessage);

module.exports = router;
