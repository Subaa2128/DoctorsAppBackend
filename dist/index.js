"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./db"));
const router = __importStar(require("./routes"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const selfsigned_1 = __importDefault(require("selfsigned"));
// Create express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8888;
// HTTP + Socket server
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned_1.default.generate(attrs, { days: 365 });
fs_1.default.writeFileSync('cert.pem', pems.cert);
fs_1.default.writeFileSync('key.pem', pems.private);
const server = https_1.default.createServer({
    key: pems.private,
    cert: pems.cert,
}, app);
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
// Express middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/users', router.userRouter);
app.use('/api/message', router.messageRouter);
app.use('/api/notifications', router.notificationRouter);
app.use('/api/chatRoom', router.chatRoomRouter);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Root route
app.get('/', (_, res) => {
    res.send('🚀 WELCOME TO DOCTORS APP BACKEND (WebSocket enabled)');
});
// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);
    socket.on('joinRoom', (roomId) => {
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
(0, db_1.default)().then(() => {
    // Start server only after DB connection is established
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
