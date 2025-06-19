"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// const DB_USERNAME = process.env.DB_USERNAME
// const DB_PASSWORD = process.env.DB_PASSWORD
// mongodb+srv://productanalystsubaa:QpAcu2cfuMXwTcUh@cluster0.zgqwiwu.mongodb.net/
const connectDB = async () => {
    try {
        const URL = `mongodb+srv://productanalystsubaa:Pahs2128!@cluster0.lt2arey.mongodb.net/?retryWrites=true&w=majority&appName=DoctorsApp`;
        // Set mongoose options
        mongoose_1.default.set('strictQuery', false);
        await mongoose_1.default.connect(URL, {
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            retryReads: true,
            family: 4 // Force IPv4
        });
        // Handle connection events
        mongoose_1.default.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't exit immediately, let the application handle the error
        throw error;
    }
};
exports.default = connectDB;
