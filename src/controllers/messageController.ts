import { Request, Response } from 'express';
import Message from '../schema/messageSchema';
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
    console.log(req.body)

    const { senderID, recipientID, roomID, text, media } = req.body;
    if (!senderID || (!recipientID && !roomID)) {
      return res.status(400).json({ message: 'Missing required fields' });
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

    const message = new Message({
      senderID,
      recipientID,
      roomID,
      text,
      media: mediaArray,
    });
    console.log(message)
    await message.save();
    res.status(201).json(message);

  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};



// Get 1-to-1 chat history
export const getSingleChatHistory = async (req: Request, res: Response) => {
  console.log(req.params)
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
    console.log(messages)
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching single chat history', error: error.message });
  }
};

// Get group chat history
export const getGroupChatHistory = async (req: Request, res: Response) => {
  try {
    const { roomID } = req.params;

    const messages = await Message.find({ roomID }).sort({ timestamp: 1 });
    console.log(messages)
    res.status(201).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching group chat history', error: error.message });
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
