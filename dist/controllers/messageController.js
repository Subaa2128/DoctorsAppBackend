"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.updateMessage = exports.getMessageById = exports.getGroupChatHistory = exports.getSingleChatHistory = exports.sendMessage = void 0;
const messageSchema_1 = __importDefault(require("../schema/messageSchema"));
// Send message
const sendMessage = async (req, res) => {
    try {
        const { senderID, recipientID, roomID, text } = req.body;
        if (!senderID || !text || (!recipientID && !roomID)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const message = new messageSchema_1.default({ senderID, recipientID, roomID, text });
        await message.save();
        res.status(201).json(message);
    }
    catch (error) {
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};
exports.sendMessage = sendMessage;
// Get 1-to-1 chat history
const getSingleChatHistory = async (req, res) => {
    try {
        const { user1, user2 } = req.body;
        const messages = await messageSchema_1.default.find({
            $or: [
                { senderID: user1, recipientID: user2 },
                { senderID: user2, recipientID: user1 },
            ],
        });
        // .sort({ timestamp: 1 });
        console.log(messages);
        res.status(200).json(messages);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching single chat history', error: error.message });
    }
};
exports.getSingleChatHistory = getSingleChatHistory;
// Get group chat history
const getGroupChatHistory = async (req, res) => {
    try {
        const { roomID } = req.body;
        const messages = await messageSchema_1.default.find({ roomID }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching group chat history', error: error.message });
    }
};
exports.getGroupChatHistory = getGroupChatHistory;
// Get message by ID
const getMessageById = async (req, res) => {
    try {
        const message = await messageSchema_1.default.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.status(200).json(message);
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving message', error: error.message });
    }
};
exports.getMessageById = getMessageById;
// Update message
const updateMessage = async (req, res) => {
    try {
        const message = await messageSchema_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.status(200).json(message);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating message', error: error.message });
    }
};
exports.updateMessage = updateMessage;
// Delete message
const deleteMessage = async (req, res) => {
    try {
        const message = await messageSchema_1.default.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.status(200).json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
};
exports.deleteMessage = deleteMessage;
