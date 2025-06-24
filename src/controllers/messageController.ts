import { Request, Response } from 'express';
import Message from '../schema/messageSchema';
import ChatRoom from '../schema/chatRoomSchema';
import axios from 'axios'; // for downloading file from URL

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

export const sendMessage = async (req: Request, res: Response) => {
  try {

    const { senderID, recipientID, roomID, text, media } = req.body;
    
    // Validate required fields
    if (!senderID) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }

    // Check if it's a group message or 1-to-1 message
    if (roomID) {
      // Validate that the room exists and sender is a member
      const chatRoom = await ChatRoom.findById(roomID);
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
        } else {
          // Group message with recipientID - this might be for mentions or specific targeting
          // We'll still treat it as a group message but store recipientID for reference
        }
      } else {
        // This is a single chat room - validate recipientID if provided
        if (recipientID) {
          // Check if recipientID matches one of the room members
          const recipientInRoom = chatRoom.members.some(member => member.id === recipientID);
          if (!recipientInRoom) {
            return res.status(400).json({ message: 'Recipient is not a member of this chat room' });
          }
        }
      }

    } else if (recipientID) {
      // 1-to-1 message without roomID - direct message
      // No additional validation needed for recipientID in direct messages
    } else {
      return res.status(400).json({ message: 'Either roomID (for group/single chat) or recipientID (for direct message) is required' });
    }

    // Validate message content
    if (!text && (!media || media.length === 0)) {
      return res.status(400).json({ message: 'Message must contain text or media' });
    }

    const mediaArray = [];

    if (media && Array.isArray(media)) {
      for (const file of media) {
        if (!file.base64) continue;

        const mediaItem: any = {
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

    const messageData: any = {
      senderID,
      text,
      media: mediaArray,
    };

    // Set appropriate IDs based on message type
    if (roomID) {
      messageData.roomID = roomID;
      // For single chat rooms, also store recipientID if provided
      if (recipientID) {
        messageData.recipientID = recipientID;
      }
    } else {
      messageData.recipientID = recipientID;
    }

    const message = new Message(messageData);
    
    await message.save();

    // Populate sender information for response
    const populatedMessage = await Message.findById(message._id)
      .populate('roomID', 'name members')
      .exec();

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error.message 
    });
  }
};

// Get 1-to-1 chat history
export const getSingleChatHistory = async (req: Request, res: Response) => {
  try {
    const { user1, user2 } = req.params;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    const messages = await Message.find({
      $or: [
        { senderID: user1, recipientID: user2 },
        { senderID: user2, recipientID: user1 },
      ],
    })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching single chat history', error: error.message });
  }
};

// Get group chat history
export const getGroupChatHistory = async (req: Request, res: Response) => {
  try {
    const { roomID } = req.params;
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const userID = req.query.userID as string; // Optional: to check if user is member

    if (!roomID) {
      return res.status(400).json({ message: 'Room ID is required' });
    }

    // Validate that the room exists
    const chatRoom = await ChatRoom.findById(roomID);
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

    const messages = await Message.find({ roomID })
      .sort({ timestamp: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('roomID', 'name members')
      .exec();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ roomID });

    console.log(`Retrieved ${messages.length} messages from group ${roomID}`);

    res.status(200).json({
      messages: messages.reverse(), // Reverse to get chronological order
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

  } catch (error: any) {
    console.error('Get Group Chat History Error:', error);
    res.status(500).json({ 
      message: 'Error fetching group chat history', 
      error: error.message 
    });
  }
};

// Get message by ID
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving message', error: error.message });
  }
};

// Update message
export const updateMessage = async (req: Request, res: Response) => {
  try {
    console.log(req)
    const message = await Message.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating message', error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Get group members
export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const { roomID } = req.params;
    const userID = req.query.userID as string; // Optional: to check if user is member

    if (!roomID) {
      return res.status(400).json({ message: 'Room ID is required' });
    }

    const chatRoom = await ChatRoom.findById(roomID);
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

  } catch (error: any) {
    console.error('Get Group Members Error:', error);
    res.status(500).json({ 
      message: 'Error fetching group members', 
      error: error.message 
    });
  }
};

// Get user's groups
export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;

    if (!userID) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userGroups = await ChatRoom.find({
      'members.id': userID,
      isGroup: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      groups: userGroups,
      groupCount: userGroups.length
    });

  } catch (error: any) {
    console.error('Get User Groups Error:', error);
    res.status(500).json({ 
      message: 'Error fetching user groups', 
      error: error.message 
    });
  }
};

// Get recent group messages (for preview)
export const getGroupRecentMessages = async (req: Request, res: Response) => {
  try {
    const { roomID } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!roomID) {
      return res.status(400).json({ message: 'Room ID is required' });
    }

    const chatRoom = await ChatRoom.findById(roomID);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const recentMessages = await Message.find({ roomID })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    res.status(200).json({
      groupName: chatRoom.name,
      recentMessages: recentMessages.reverse(), // Chronological order
      totalMessages: await Message.countDocuments({ roomID })
    });

  } catch (error: any) {
    console.error('Get Group Recent Messages Error:', error);
    res.status(500).json({ 
      message: 'Error fetching recent group messages', 
      error: error.message 
    });
  }
};
