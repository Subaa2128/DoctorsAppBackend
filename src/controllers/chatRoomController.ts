import { Request, Response } from 'express';
import ChatRoom from '../schema/chatRoomSchema';
import mongoose from 'mongoose';

// Create new chat room
// chatRoomController.ts


export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, groupCreaterId, members, isGroup } = req.body;

    // Basic validation
    if (!name || !groupCreaterId || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or invalid data.' });
    }

    const newRoom = new ChatRoom({
      name,
      groupCreaterId,
      members,
      isGroup: isGroup ?? true // Default to true if not provided
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Get all rooms for a user
export const getRoomsForUser = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const rooms = await ChatRoom.find({ groupCreaterId: userID })
    res.status(200).json(rooms);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
  }
};

// Get a room by ID
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(room);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch room', error: error.message });
  }
};

// Update a chat room
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const updatedRoom = await ChatRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRoom) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(updatedRoom);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update room', error: error.message });
  }
};

// Delete a chat room
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const room = await ChatRoom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete room', error: error.message });
  }
};
