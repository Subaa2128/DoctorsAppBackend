import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './db';
import * as router from './routes';
import path from 'path';
import fs from 'fs';
import https from 'https';
import selfsigned from 'selfsigned';
// Create express app
const app = express();
const PORT = process.env.PORT || 8888;

// HTTP + Socket server
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

fs.writeFileSync('cert.pem', pems.cert);
fs.writeFileSync('key.pem', pems.private);

const server = https.createServer({
  key: pems.private,
  cert: pems.cert,
}, app);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Express middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', router.userRouter);
app.use('/api/message', router.messageRouter);
app.use('/api/notifications', router.notificationRouter);
app.use('/api/chatRoom', router.chatRoomRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Root route
app.get('/', (_, res) => {
  res.send('🚀 WELCOME TO DOCTORS APP BACKEND (WebSocket enabled)');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('sendMessage', (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit('receiveMessage', message);
    console.log(`Message sent to room ${roomId}:`, message);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
connectDB().then(() => {
  // Start server only after DB connection is established
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
