import { Request, Response } from 'express';
import User from '../schema/userSchema'

// Create User
export const createUser = async (req: Request, res: Response) => {
    try {

        const existing = await User.findOne({userID:req.body.userID});
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err: any) {
        console.log(err)
        res.status(400).json({ error: err.message });
    }
};

// Get All Users
export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get User by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { userID } = req.params;
        console.log(userID)
        const user = await User.findOne({ userID });
        console.log(user)

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userID } = req.params;
        const user = await User.findOneAndUpdate({ userID }, req.body, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Find and Update User by userID
export const findAndUpdateByUserId = async (req: Request, res: Response) => {
    try {
        const { userID } = req.params;
        const user = await User.findOneAndUpdate({ userID }, req.body, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete User
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
