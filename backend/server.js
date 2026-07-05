const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const Message = require('./models/Message');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const aiRoutes = require('./routes/aiRoutes');
const app = express();
connectDB();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Routes
app.get('/', (req, res) => {
    res.send('Pulse Chat API is running...');
});

// 1. Wrap the Express app in a raw Node HTTP server
const server = http.createServer(app);

// 2. Attach the Socket.io server to the raw HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // We will lock this down for security later
        methods: ["GET", "POST"]
    }
});

// 3. The Event Listener (The open phone line)
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // When the frontend asks to join a private room
    socket.on('join_room', (data) => {
        socket.join(data.room);
        console.log(`User ${socket.id} joined room: ${data.room}`);
    });

    // When the frontend sends a message, save it to DB, then bounce it back
    socket.on('send_message', async (data) => {
        try {
            // Save to database
            await Message.create({
                sender: data.senderId,
                receiver: data.receiverId,
                encryptedContent: data.text, // Temporary, will be encrypted in Phase 5
                iv: data.iv || 'temp_iv'
            });

            socket.to(data.room).emit('receive_message', data);
        } catch (error) {
            console.error("Failed to save message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Initialize Cron Jobs
require('./jobs/cron')(io);

// 4. IMPORTANT: We now start the 'server' object, NOT the 'app' object!
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

