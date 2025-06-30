"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoom = exports.updateRoom = exports.getRoomById = exports.getRoomsForUser = exports.createRoom = void 0;
const chatRoomSchema_1 = __importDefault(require("../schema/chatRoomSchema"));
const userSchema_1 = __importDefault(require("../schema/userSchema"));
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
        // Find rooms where user is either the groupCreaterId or a member
        const rooms = await chatRoomSchema_1.default.find({
            $or: [
                { groupCreaterId: userID },
                { 'members.id': userID }
            ]
        });
        // Enrich members with user details
        const enrichedRooms = await Promise.all(rooms.map(async (room) => {
            const enrichedMembers = await Promise.all((room.members || []).map(async (member) => {
                // Try to find user by id (member.id)
                const user = await userSchema_1.default.findOne({ userID: member.id });
                if (user) {
                    return {
                        id: user.userID,
                        name: user.name,
                        department: user.department,
                        imageUrl: user.photoUrl,
                    };
                }
                // fallback to original member if user not found
                return member;
            }));
            return {
                ...room.toObject(),
                members: enrichedMembers,
            };
        }));
        res.status(200).json(enrichedRooms);
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
