const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { username, email, password, publicKey } = req.body;

        // 1. Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the user in the database
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            publicKey
        });

        // 4. Generate the JWT "Wristband"
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d' // User stays logged in for 30 days
        });

        // 5. Send success response back to React
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: token
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password, publicKey } = req.body;

        // 1. Find the user by email
        const user = await User.findOne({ email });
        
        // 2. Check if user exists AND if the password matches the hash
        if (user && (await bcrypt.compare(password, user.password))) {
            
            // Update public key if they logged in from a new device (new keys generated)
            if (publicKey && publicKey !== user.publicKey) {
                user.publicKey = publicKey;
                await user.save();
            }

            // 3. Generate a new JWT
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            });

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: token
            });
        } else {
            // 401 Unauthorized
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = { registerUser, loginUser };
