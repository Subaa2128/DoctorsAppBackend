"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupRecentMessages = exports.getUserGroups = exports.getGroupMembers = exports.deleteMessage = exports.updateMessage = exports.getMessageById = exports.getGroupChatHistory = exports.getSingleChatHistory = exports.sendMessage = void 0;
const messageSchema_1 = __importDefault(require("../schema/messageSchema"));
const chatRoomSchema_1 = __importDefault(require("../schema/chatRoomSchema"));
const encrysption_1 = require("../encrysption");
// Send message
// export const sendMessage = async (req: Request, res: Response) => {
//   try {
//     const { senderID, recipientID, roomID, text } = req.body;
//     if (!senderID || !text || (!recipientID && !roomID)) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }
//     const message = new Message({ senderID, recipientID, roomID, text });
//     await message.save();
//     res.status(201).json(message);
//   } catch (error: any) {
//     res.status(500).json({ message: 'Error sending message', error: error.message });
//   }
// };
const sendMessage = async (req, res) => {
    try {
        const { senderID, recipientID, roomID, text, media } = req.body;
        // Validate required fields
        if (!senderID) {
            return res.status(400).json({ message: 'Sender ID is required' });
        }
        // Check if it's a group message or 1-to-1 message
        if (roomID) {
            // Validate that the room exists and sender is a member
            const chatRoom = await chatRoomSchema_1.default.findById(roomID);
            if (!chatRoom) {
                return res.status(404).json({ message: 'Chat room not found' });
            }
            // Check if sender is a member of the group
            const isMember = chatRoom.members.some(member => member.id === senderID);
            if (!isMember) {
                return res.status(403).json({ message: 'You are not a member of this group' });
            }
            // If it's a group chat, validate that the room is actually a group
            if (chatRoom.isGroup) {
                // This is a group message - recipientID is not needed
                if (!recipientID) {
                    // Group message - no recipientID needed
                }
                else {
                    // Group message with recipientID - this might be for mentions or specific targeting
                    // We'll still treat it as a group message but store recipientID for reference
                }
            }
            else {
                // This is a single chat room - validate recipientID if provided
                if (recipientID) {
                    // Check if recipientID matches one of the room members
                    const recipientInRoom = chatRoom.members.some(member => member.id === recipientID);
                    if (!recipientInRoom) {
                        return res.status(400).json({ message: 'Recipient is not a member of this chat room' });
                    }
                }
            }
        }
        else if (recipientID) {
            // 1-to-1 message without roomID - direct message
            // No additional validation needed for recipientID in direct messages
        }
        else {
            return res.status(400).json({ message: 'Either roomID (for group/single chat) or recipientID (for direct message) is required' });
        }
        // Validate message content
        if (!text && (!media || media.length === 0)) {
            return res.status(400).json({ message: 'Message must contain text or media' });
        }
        const mediaArray = [];
        if (media && Array.isArray(media)) {
            for (const file of media) {
                if (!file.base64)
                    continue;
                const mediaItem = {
                    type: file.type || 'file',
                    fileName: file.fileName,
                    mimeType: file.mimeType,
                    size: file.size,
                    url: file.base64,
                };
                // Add duration for video and voice files
                if ((file.type === 'video' || file.type === 'voice') && file.duration) {
                    mediaItem.duration = file.duration;
                }
                mediaArray.push(mediaItem);
            }
        }
        const messageData = {
            senderID,
            text: text ? (() => {
                try {
                    return (0, encrysption_1.encryptText)(text);
                }
                catch (encryptError) {
                    console.error('Encryption error:', encryptError);
                    throw new Error('Failed to encrypt message text');
                }
            })() : null,
            media: mediaArray,
        };
        // Set appropriate IDs based on message type
        if (roomID) {
            messageData.roomID = roomID;
            // For single chat rooms, also store recipientID if provided
            if (recipientID) {
                messageData.recipientID = recipientID;
            }
        }
        else {
            messageData.recipientID = recipientID;
        }
        const message = new messageSchema_1.default(messageData);
        await message.save();
        // Populate sender information for response
        const populatedMessage = await messageSchema_1.default.findById(message._id)
            .populate('roomID', 'name members')
            .exec();
        res.status(201).json({
            message: 'Message sent successfully',
            data: populatedMessage
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error sending message',
            error: error.message
        });
    }
};
exports.sendMessage = sendMessage;
// Get 1-to-1 chat history
const getSingleChatHistory = async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const messages = await messageSchema_1.default.find({
            $or: [
                { senderID: user1, recipientID: user2 },
                { senderID: user2, recipientID: user1 },
            ],
        })
            .sort({ timestamp: 1 })
            .skip(skip)
            .limit(limit);
        const decryptedMessages = messages.map(msg => {
            try {
                return {
                    ...msg.toObject(),
                    text: msg.text ? (0, encrysption_1.decryptText)(msg.text) : null
                };
            }
            catch (decryptError) {
                console.error('Decryption error for message:', msg._id, decryptError);
                return {
                    ...msg.toObject(),
                    text: '[Encrypted message - unable to decrypt]'
                };
            }
        });
        res.status(200).json(decryptedMessages);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching single chat history', error: error.message });
    }
};
exports.getSingleChatHistory = getSingleChatHistory;
// Get group chat history
const getGroupChatHistory = async (req, res) => {
    try {
        const { roomID } = req.params;
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const userID = req.query.userID; // Optional: to check if user is member
        if (!roomID) {
            return res.status(400).json({ message: 'Room ID is required' });
        }
        // Validate that the room exists
        const chatRoom = await chatRoomSchema_1.default.findById(roomID);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        // If userID is provided, check if user is a member
        if (userID) {
            const isMember = chatRoom.members.some(member => member.id === userID);
            if (!isMember) {
                return res.status(403).json({ message: 'You are not a member of this group' });
            }
        }
        // Validate that it's actually a group
        if (!chatRoom.isGroup) {
            return res.status(400).json({ message: 'This is not a group chat room' });
        }
        const messages = await messageSchema_1.default.find({ roomID })
            .sort({ timestamp: -1 }) // Most recent first
            .skip(skip)
            .limit(limit)
            .populate('roomID', 'name members')
            .exec();
        const decryptedMessages = messages.map(msg => {
            try {
                return {
                    ...msg.toObject(),
                    text: msg.text ? (0, encrysption_1.decryptText)(msg.text) : null
                };
            }
            catch (decryptError) {
                console.error('Decryption error for message:', msg._id, decryptError);
                return {
                    ...msg.toObject(),
                    text: '[Encrypted message - unable to decrypt]'
                };
            }
        });
        // Get total count for pagination
        const totalMessages = await messageSchema_1.default.countDocuments({ roomID });
        console.log(`Retrieved ${decryptedMessages.length} messages from group ${roomID}`);
        res.status(200).json({
            messages: decryptedMessages.reverse(), // Reverse to get chronological order
            pagination: {
                skip,
                limit,
                total: totalMessages,
                hasMore: skip + limit < totalMessages
            },
            groupInfo: {
                name: chatRoom.name,
                memberCount: chatRoom.members.length
            }
        });
    }
    catch (error) {
        console.error('Get Group Chat History Error:', error);
        res.status(500).json({
            message: 'Error fetching group chat history',
            error: error.message
        });
    }
};
exports.getGroupChatHistory = getGroupChatHistory;
// Get message by ID
const getMessageById = async (req, res) => {
    try {
        const message = await messageSchema_1.default.findById(req.params.id);
        if (!message)
            return res.status(404).json({ message: 'Message not found' });
        try {
            message.text = message.text ? (0, encrysption_1.decryptText)(message.text) : undefined;
        }
        catch (decryptError) {
            console.error('Decryption error for message:', message._id, decryptError);
            message.text = '[Encrypted message - unable to decrypt]';
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
        console.log(req);
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
// Get group members
const getGroupMembers = async (req, res) => {
    try {
        const { roomID } = req.params;
        const userID = req.query.userID; // Optional: to check if user is member
        if (!roomID) {
            return res.status(400).json({ message: 'Room ID is required' });
        }
        const chatRoom = await chatRoomSchema_1.default.findById(roomID);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        // If userID is provided, check if user is a member
        if (userID) {
            const isMember = chatRoom.members.some(member => member.id === userID);
            if (!isMember) {
                return res.status(403).json({ message: 'You are not a member of this group' });
            }
        }
        res.status(200).json({
            groupName: chatRoom.name,
            members: chatRoom.members,
            memberCount: chatRoom.members.length,
            createdAt: chatRoom.createdAt
        });
    }
    catch (error) {
        console.error('Get Group Members Error:', error);
        res.status(500).json({
            message: 'Error fetching group members',
            error: error.message
        });
    }
};
exports.getGroupMembers = getGroupMembers;
// Get user's groups
const getUserGroups = async (req, res) => {
    try {
        const { userID } = req.params;
        if (!userID) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const userGroups = await chatRoomSchema_1.default.find({
            'members.id': userID,
            isGroup: true
        }).sort({ createdAt: -1 });
        res.status(200).json({
            groups: userGroups,
            groupCount: userGroups.length
        });
    }
    catch (error) {
        console.error('Get User Groups Error:', error);
        res.status(500).json({
            message: 'Error fetching user groups',
            error: error.message
        });
    }
};
exports.getUserGroups = getUserGroups;
// Get recent group messages (for preview)
const getGroupRecentMessages = async (req, res) => {
    try {
        const { roomID } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        if (!roomID) {
            return res.status(400).json({ message: 'Room ID is required' });
        }
        const chatRoom = await chatRoomSchema_1.default.findById(roomID);
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        const recentMessages = await messageSchema_1.default.find({ roomID })
            .sort({ timestamp: -1 })
            .limit(limit)
            .exec();
        res.status(200).json({
            groupName: chatRoom.name,
            recentMessages: recentMessages.reverse(), // Chronological order
            totalMessages: await messageSchema_1.default.countDocuments({ roomID })
        });
    }
    catch (error) {
        console.error('Get Group Recent Messages Error:', error);
        res.status(500).json({
            message: 'Error fetching recent group messages',
            error: error.message
        });
    }
};
exports.getGroupRecentMessages = getGroupRecentMessages;
