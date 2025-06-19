"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoom = exports.updateRoom = exports.getRoomById = exports.getRoomsForUser = exports.createRoom = void 0;
const chatRoomSchema_1 = __importDefault(require("../schema/chatRoomSchema"));
// Create new chat room
// chatRoomController.ts
const createRoom = async (req, res) => {
    try {
        const { name, groupCreaterId, members, isGroup } = req.body;
        // Basic validation
        if (!name || !groupCreaterId || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: 'Missing required fields or invalid data.' });
        }
        const newRoom = new chatRoomSchema_1.default({
            name,
            groupCreaterId,
            members,
            isGroup: isGroup ?? true // Default to true if not provided
        });
        const savedRoom = await newRoom.save();
        res.status(201).json(savedRoom);
    }
    catch (error) {
        console.error('Error creating chat room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createRoom = createRoom;
// Get all rooms for a user
const getRoomsForUser = async (req, res) => {
    try {
        const { userID } = req.params;
        const rooms = await chatRoomSchema_1.default.find({ groupCreaterId: userID });
        // .populate({
        //   path: 'members',
        //   select: 'name photoUrl department', // only these fields
        // });
        console.log(rooms);
        res.status(200).json(rooms);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
    }
};
exports.getRoomsForUser = getRoomsForUser;
// Get a room by ID
const getRoomById = async (req, res) => {
    try {
        const room = await chatRoomSchema_1.default.findById(req.params.id);
        if (!room)
            return res.status(404).json({ message: 'Room not found' });
        res.status(200).json(room);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch room', error: error.message });
    }
};
exports.getRoomById = getRoomById;
// Update a chat room
const updateRoom = async (req, res) => {
    try {
        const updatedRoom = await chatRoomSchema_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRoom)
            return res.status(404).json({ message: 'Room not found' });
        res.status(200).json(updatedRoom);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update room', error: error.message });
    }
};
exports.updateRoom = updateRoom;
// Delete a chat room
const deleteRoom = async (req, res) => {
    try {
        const room = await chatRoomSchema_1.default.findByIdAndDelete(req.params.id);
        if (!room)
            return res.status(404).json({ message: 'Room not found' });
        res.status(200).json({ message: 'Room deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete room', error: error.message });
    }
};
exports.deleteRoom = deleteRoom;
