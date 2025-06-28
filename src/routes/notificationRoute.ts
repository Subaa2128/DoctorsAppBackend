import express from 'express';
import { 
  sendChatPushNotification, 
  sendNotification,
  createNotification,
  getNotifications,
  cleanupOldNotifications,
  markNotificationItemAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController';

const router = express.Router();

// Existing FCM notification routes
router.post('/send-notification', sendNotification);
router.post('/sendchatnotification', sendChatPushNotification as any);

// New notification schema routes
router.post('/create', createNotification as any);
router.get('/user/:userId', getNotifications as any);
router.delete('/cleanup', cleanupOldNotifications as any);

// Mark notifications as read routes
router.put('/mark-item-read', markNotificationItemAsRead as any);
router.put('/user/:userId/mark-all-read', markAllNotificationsAsRead as any);

export default router;
