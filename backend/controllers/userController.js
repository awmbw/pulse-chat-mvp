const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        // Find all users EXCEPT the user who is currently logged in ($ne = not equal)
        const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getUsers };
