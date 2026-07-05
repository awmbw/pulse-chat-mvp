const express = require('express');
const router = express.Router();
const { translateText, summarizeChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/translate', protect, translateText);
router.post('/summarize', protect, summarizeChat);

module.exports = router;
