const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Root route to verify server is running
app.get('/', (req, res) => {
    res.send('hello from server');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://codeshare2-o-client.onrender.com",
        methods: ["GET", "POST"]
    }
});

let code = "// Start coding here...";

const lastNotificationTime = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send initial code to the new user
    socket.emit('code-update', code);

    // Handle code changes
    socket.on('code-change', (newCode) => {
        console.log(`Code change received from ${socket.id}`);
        code = newCode;
        // Broadcast to everyone else
        socket.broadcast.emit('code-update', code);

        // Notification Throttling: only notify once every 10 seconds per user
        const now = Date.now();
        const lastTime = lastNotificationTime.get(socket.id) || 0;

        if (now - lastTime > 10000) { // 10 seconds throttle
            console.log(`Emitting notification from ${socket.id} to others (Throttled)`);
            socket.broadcast.emit('new-text-notification', {
                message: "New text added!",
                senderId: socket.id
            });
            lastNotificationTime.set(socket.id, now);
        } else {
            console.log(`Notification throttled for ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        lastNotificationTime.delete(socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
