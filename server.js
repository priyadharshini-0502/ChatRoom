const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

// Create Express app
const app = express();

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = socketio(server);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const botName ='ChatCord Bot';

// Handle Socket.IO connections
io.on('connection', socket => {
    socket.on('joinRoom',({username,room}) => {
        const user = userJoin(socket.id,username,room);

        socket.join(user.room);
        socket.emit('message', formatMessage(botName,'Welcome to ChatCord!'));

        // Broadcast a message to all clients except the newly connected client
        socket.broadcast
       .to(user.room)
       .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    
    });
    // Listen for chat messages from clients
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
    
        io.to(user.room).emit("message", formatMessage(user.username, msg));
      });

    // Handle client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit(
              "message",
              formatMessage(botName, `${user.username} has left the chat`)
            );
        }

        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
          });
    });
});

// Define the port and start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
