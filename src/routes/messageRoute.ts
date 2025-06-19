import express from 'express';
import {
  sendMessage,
  getSingleChatHistory,
  getGroupChatHistory,
  deleteMessage,
  updateMessage,
  getMessageById,
} from '../controllers/messageController';
import { upload } from '../middleware/upload';

const router = express.Router();

// router.post('/send', upload.single('media'), sendMessage as any);
router.post('/send', sendMessage as any);                       
router.get('/history/single/:user1/:user2', getSingleChatHistory as any);   
router.get('/history/group/:roomID', getGroupChatHistory);
router.get('/:id', getMessageById as any);                       
router.put('/:id', updateMessage as any);                        
router.delete('/:id', deleteMessage as any);              

export default router;
