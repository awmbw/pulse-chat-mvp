const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users (excluding the logged in user)
// @access  Private (Requires JWT Token)
router.get('/', protect, getUsers);

module.exports = router;
