const express = require('express');
const router = express.Router();
const { getUploadUrl, getReadUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.post('/presigned-url', protect, getUploadUrl);
router.get('/read-url/:key', protect, getReadUrl);

module.exports = router;
