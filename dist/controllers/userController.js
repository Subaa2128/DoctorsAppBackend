"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.findAndUpdateByUserId = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.createUser = void 0;
const userSchema_1 = __importDefault(require("../schema/userSchema"));
// Create User
const createUser = async (req, res) => {
    try {
        const existing = await userSchema_1.default.findOne({ userID: req.body.userID });
        if (existing)
            return res.status(400).json({ message: 'User already exists' });
        const user = await userSchema_1.default.create(req.body);
        res.status(201).json(user);
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};
exports.createUser = createUser;
// Get All Users
const getAllUsers = async (_req, res) => {
    try {
        const users = await userSchema_1.default.find();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllUsers = getAllUsers;
// Get User by ID
const getUserById = async (req, res) => {
    try {
        const { userID } = req.params;
        const user = await userSchema_1.default.findOne({ userID });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    try {
        const { userID } = req.params;
        const user = await userSchema_1.default.findOneAndUpdate({ userID }, req.body, { new: true });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateUser = updateUser;
// Find and Update User by userID
const findAndUpdateByUserId = async (req, res) => {
    try {
        const { userID } = req.params;
        const user = await userSchema_1.default.findOneAndUpdate({ userID }, req.body, { new: true });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.findAndUpdateByUserId = findAndUpdateByUserId;
// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await userSchema_1.default.findByIdAndDelete(req.params.id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteUser = deleteUser;
