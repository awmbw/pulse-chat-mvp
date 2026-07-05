const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

async function getToken() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./backend/models/User');
    const user = await User.findOne();
    if (!user) {
        console.log("No users found");
        process.exit(1);
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log(token);
    process.exit(0);
}
getToken();
