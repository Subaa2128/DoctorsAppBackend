"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// Existing FCM notification routes
router.post('/send-notification', notificationController_1.sendNotification);
router.post('/sendchatnotification', notificationController_1.sendChatPushNotification);
// New notification schema routes
router.post('/create', notificationController_1.createNotification);
router.get('/user/:userId', notificationController_1.getNotifications);
router.get('/details/:notificationId', notificationController_1.getNotificationDetails);
router.patch('/:notificationId/:type/:index/read', notificationController_1.markNotificationAsRead);
router.patch('/:notificationId/mark-multiple-read', notificationController_1.markMultipleNotificationsAsRead);
router.patch('/user/:userId/read-all', notificationController_1.markAllNotificationsAsRead);
router.delete('/cleanup', notificationController_1.cleanupOldNotifications);
// Test push notification route
router.post('/test-push', notificationController_1.testPushNotification);
exports.default = router;
