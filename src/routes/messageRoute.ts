import express from 'express';
import {
  sendMessage,
  getSingleChatHistory,
  getGroupChatHistory,
  deleteMessage,
  updateMessage,
  getMessageById,
  getGroupMembers,
  getUserGroups,
  getGroupRecentMessages,
  markMessageAsRead,
  markMessagesAsRead,
  getUnreadMessageCount,
  getUnreadMessages,
} from '../controllers/messageController';
import { upload } from '../middleware/upload';

const router = express.Router();

// router.post('/send', upload.single('media'), sendMessage as any);
router.post('/send', sendMessage as any);                       
router.get('/history/single/:user1/:user2', getSingleChatHistory as any);   
router.get('/history/group/:roomID', getGroupChatHistory as any);
router.get('/:id', getMessageById as any);                       
router.put('/:id', updateMessage as any);                        
router.delete('/:id', deleteMessage as any);              

// Read status routes
router.post('/read/:messageID', markMessageAsRead as any);
router.post('/read-multiple', markMessagesAsRead as any);
router.get('/unread/count/:userID', getUnreadMessageCount as any);
router.get('/unread/:userID', getUnreadMessages as any);

// Group operations
router.get('/group/members/:roomID', getGroupMembers as any);
router.get('/group/recent/:roomID', getGroupRecentMessages as any);
router.get('/user/groups/:userID', getUserGroups as any);

export default router;
