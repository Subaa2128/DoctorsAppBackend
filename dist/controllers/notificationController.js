"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationDetails = exports.testPushNotification = exports.cleanupOldNotifications = exports.markAllNotificationsAsRead = exports.markMultipleNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = exports.createNotification = exports.sendChatPushNotification = exports.sendNotification = void 0;
const firebaseAdmin_1 = __importDefault(require("../firebase/firebaseAdmin"));
const buildNotification_1 = require("../utils/buildNotification");
const notificationSchema_1 = __importDefault(require("../schema/notificationSchema"));
const userSchema_1 = __importDefault(require("../schema/userSchema"));
const sendNotification = async (req, res) => {
    const { token, title, body, navigationId } = req.body;
    const message = {
        token,
        notification: { title, body },
        data: {
            navigationId: navigationId ?? 'Dashboard',
        },
        android: {
            notification: {
                channelId: 'hi',
                sound: 'default',
                icon: 'ic_stat_name',
            },
        },
    };
    try {
        const response = await firebaseAdmin_1.default.messaging().send(message);
        console.log('FCM response:', response);
        res.json({ success: true, response });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.sendNotification = sendNotification;
const sendChatPushNotification = async (req, res) => {
    try {
        const { recipientToken, senderName, messageText, chatRoomId, groupName, messageType = 'text', isGroup = false, } = req.body;
        if (!recipientToken || !senderName || !messageText) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const message = (0, buildNotification_1.buildChatNotificationMessage)({
            recipientToken,
            senderName,
            groupName,
            messageText,
            chatRoomId,
            messageType,
            isGroup,
        });
        const response = await firebaseAdmin_1.default.messaging().send(message);
        console.log('Notification sent:', response);
        res.status(200).json({ success: true, response });
    }
    catch (error) {
        console.error('Notification send failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.sendChatPushNotification = sendChatPushNotification;
// Helper function to send push notifications for patient notifications
const sendPatientPushNotifications = async (userId, notificationData) => {
    try {
        // Get user's FCM token
        const user = await userSchema_1.default.findOne({ userID: userId });
        if (!user || !user.token) {
            console.log(`No FCM token found for user: ${userId}`);
            return;
        }
        const notifications = [];
        // Send notification for Opinions
        if (notificationData.Opinion && notificationData.Opinion.length > 0) {
            const firstOpinion = notificationData.Opinion[0];
            const message = (0, buildNotification_1.buildPatientNotificationMessage)({
                recipientToken: user.token,
                notificationType: 'Opinion',
                patientName: firstOpinion.Patient_Name,
                count: notificationData.Opinion.length,
                priority: firstOpinion.Opinions?.[0]?.Priority,
                ward: firstOpinion.Ward,
                speciality: firstOpinion.Speciality,
            });
            notifications.push(firebaseAdmin_1.default.messaging().send(message));
        }
        // Send notification for Critical Values
        if (notificationData.CriticalValue && notificationData.CriticalValue.length > 0) {
            const firstCriticalValue = notificationData.CriticalValue[0];
            const message = (0, buildNotification_1.buildPatientNotificationMessage)({
                recipientToken: user.token,
                notificationType: 'CriticalValue',
                patientName: firstCriticalValue.Patient_Name,
                count: notificationData.CriticalValue.length,
                ward: firstCriticalValue.Ward,
            });
            notifications.push(firebaseAdmin_1.default.messaging().send(message));
        }
        // Send notification for Appointments
        if (notificationData.Appointment && notificationData.Appointment.length > 0) {
            const firstAppointment = notificationData.Appointment[0];
            const message = (0, buildNotification_1.buildPatientNotificationMessage)({
                recipientToken: user.token,
                notificationType: 'Appointment',
                patientName: firstAppointment.Patient_Name,
                count: notificationData.Appointment.length,
            });
            notifications.push(firebaseAdmin_1.default.messaging().send(message));
        }
        // Send all notifications
        if (notifications.length > 0) {
            const results = await Promise.allSettled(notifications);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    console.log(`Push notification sent successfully for user ${userId}`);
                }
                else {
                    console.error(`Failed to send push notification for user ${userId}:`, result.reason);
                }
            });
        }
    }
    catch (error) {
        console.error('Error sending push notifications:', error);
    }
};
// Create or update notifications for a user
const createNotification = async (req, res) => {
    try {
        const { userId, Opinion, CriticalValue, Appointment } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        console.log('Request body:', { userId, Opinion: Opinion?.length, CriticalValue: CriticalValue?.length, Appointment: Appointment?.length });
        // Normalize and fill missing fields with default values
        const normalizeOpinionData = (items) => {
            if (!items || items.length === 0)
                return [];
            return items.map((item) => ({
                Opinions: item.Opinions || [{ Opinion: "No opinion details", Priority: "Normal" }],
                Patient_Name: item.Patient_Name || "Unknown Patient",
                UHID: item.UHID || "N/A",
                OPIP_No: item.OPIP_No || "N/A",
                Speciality: item.Speciality || "General",
                Ward: item.Ward || "General Ward",
                Bed_Type: item.Bed_Type || "General",
                Bed: item.Bed || "N/A",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        };
        const normalizeCriticalValueData = (items) => {
            if (!items || items.length === 0)
                return [];
            return items.map((item) => ({
                CriticalValues: item.CriticalValues || [{ Investigation: "No investigation details", Value: "N/A" }],
                Patient_Name: item.Patient_Name || "Unknown Patient",
                UHID: item.UHID || "N/A",
                OPIP_No: item.OPIP_No || "N/A",
                Age: item.Age || "N/A",
                Ward: item.Ward || "General Ward",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        };
        const normalizeAppointmentData = (items) => {
            if (!items || items.length === 0)
                return [];
            return items.map((item) => ({
                Patient_Name: item.Patient_Name || "Unknown Patient",
                UHID: item.UHID || "N/A",
                Age: item.Age || "N/A",
                Age_Type: item.Age_Type || "Years",
                Gender: item.Gender || "Not Specified",
                App_No: item.App_No || "N/A",
                App_Date: item.App_Date || new Date().toLocaleDateString(),
                App_Time: item.App_Time || "N/A",
                App_Type: item.App_Type || "General",
                Patient_Type: item.Patient_Type || "Not Specified",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        };
        // Check for duplicates based on patient name and appointment details
        const checkForDuplicates = async (normalizedData) => {
            const duplicates = {
                Opinion: [],
                CriticalValue: [],
                Appointment: []
            };
            // Get all notifications for this user
            const allNotifications = await notificationSchema_1.default.find({ userId });
            // Check Opinion duplicates
            if (normalizedData.Opinion && normalizedData.Opinion.length > 0) {
                for (const newOpinion of normalizedData.Opinion) {
                    const isDuplicate = allNotifications.some(notification => notification.Opinion.some(existingOpinion => existingOpinion.Patient_Name === newOpinion.Patient_Name &&
                        existingOpinion.UHID === newOpinion.UHID &&
                        existingOpinion.OPIP_No === newOpinion.OPIP_No));
                    if (isDuplicate) {
                        duplicates.Opinion.push(newOpinion);
                    }
                }
            }
            // Check CriticalValue duplicates
            if (normalizedData.CriticalValue && normalizedData.CriticalValue.length > 0) {
                for (const newCriticalValue of normalizedData.CriticalValue) {
                    const isDuplicate = allNotifications.some(notification => notification.CriticalValue.some(existingCriticalValue => existingCriticalValue.Patient_Name === newCriticalValue.Patient_Name &&
                        existingCriticalValue.UHID === newCriticalValue.UHID &&
                        existingCriticalValue.OPIP_No === newCriticalValue.OPIP_No));
                    if (isDuplicate) {
                        duplicates.CriticalValue.push(newCriticalValue);
                    }
                }
            }
            // Check Appointment duplicates
            if (normalizedData.Appointment && normalizedData.Appointment.length > 0) {
                for (const newAppointment of normalizedData.Appointment) {
                    const isDuplicate = allNotifications.some(notification => notification.Appointment.some(existingAppointment => existingAppointment.Patient_Name === newAppointment.Patient_Name &&
                        existingAppointment.App_No === newAppointment.App_No &&
                        existingAppointment.App_Date === newAppointment.App_Date));
                    if (isDuplicate) {
                        duplicates.Appointment.push(newAppointment);
                    }
                }
            }
            return duplicates;
        };
        // Get current date (start of day)
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        // Check if notification already exists for today
        let notification = await notificationSchema_1.default.findOne({
            userId,
            date: {
                $gte: currentDate,
                $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        const isNewNotification = !notification;
        const now = new Date();
        console.log('Creating notification for userId:', userId, 'isNewNotification:', isNewNotification, 'existing notification:', !!notification);
        // Prepare notification data with timestamps and default values
        const prepareNotificationData = (items, normalizer) => {
            if (!items || items.length === 0)
                return [];
            const normalized = normalizer(items);
            console.log('Prepared items:', normalized.length);
            return normalized;
        };
        // Prepare normalized data for duplicate checking
        const normalizedData = {
            Opinion: prepareNotificationData(Opinion, normalizeOpinionData),
            CriticalValue: prepareNotificationData(CriticalValue, normalizeCriticalValueData),
            Appointment: prepareNotificationData(Appointment, normalizeAppointmentData)
        };
        // Check for duplicates
        const duplicates = await checkForDuplicates(normalizedData);
        // Filter out duplicates
        const filteredData = {
            Opinion: normalizedData.Opinion.filter(item => !duplicates.Opinion.some(dup => dup.Patient_Name === item.Patient_Name &&
                dup.UHID === item.UHID &&
                dup.OPIP_No === item.OPIP_No)),
            CriticalValue: normalizedData.CriticalValue.filter(item => !duplicates.CriticalValue.some(dup => dup.Patient_Name === item.Patient_Name &&
                dup.UHID === item.UHID &&
                dup.OPIP_No === item.OPIP_No)),
            Appointment: normalizedData.Appointment.filter(item => !duplicates.Appointment.some(dup => dup.Patient_Name === item.Patient_Name &&
                dup.App_No === item.App_No &&
                dup.App_Date === item.App_Date))
        };
        console.log('Duplicates found:', {
            Opinion: duplicates.Opinion.length,
            CriticalValue: duplicates.CriticalValue.length,
            Appointment: duplicates.Appointment.length
        });
        console.log('Filtered data to add:', {
            Opinion: filteredData.Opinion.length,
            CriticalValue: filteredData.CriticalValue.length,
            Appointment: filteredData.Appointment.length
        });
        if (notification) {
            console.log('Updating existing notification. Current counts:', {
                Opinion: notification.Opinion?.length || 0,
                CriticalValue: notification.CriticalValue?.length || 0,
                Appointment: notification.Appointment?.length || 0
            });
            // Update existing notification - merge arrays instead of replacing
            if (filteredData.Opinion.length > 0) {
                notification.Opinion = [...notification.Opinion, ...filteredData.Opinion];
                console.log('Updated Opinion count:', notification.Opinion.length);
            }
            if (filteredData.CriticalValue.length > 0) {
                notification.CriticalValue = [...notification.CriticalValue, ...filteredData.CriticalValue];
                console.log('Updated CriticalValue count:', notification.CriticalValue.length);
            }
            if (filteredData.Appointment.length > 0) {
                notification.Appointment = [...notification.Appointment, ...filteredData.Appointment];
                console.log('Updated Appointment count:', notification.Appointment.length);
            }
            await notification.save();
            console.log('Existing notification updated successfully');
        }
        else {
            console.log('Creating new notification');
            // Create new notification
            notification = new notificationSchema_1.default({
                userId,
                date: currentDate,
                ...filteredData
            });
            await notification.save();
            console.log('New notification created successfully with ID:', notification._id);
        }
        // Send push notifications only for new notifications or when there are new items
        if (isNewNotification || filteredData.Opinion.length > 0 || filteredData.CriticalValue.length > 0 || filteredData.Appointment.length > 0) {
            console.log('Sending push notifications');
            // Send push notifications in background (don't wait for it)
            sendPatientPushNotifications(userId, filteredData).catch(error => {
                console.error('Background push notification error:', error);
            });
        }
        res.status(200).json({
            success: true,
            message: 'Notification created/updated successfully',
            notification,
            duplicates: {
                Opinion: duplicates.Opinion.length,
                CriticalValue: duplicates.CriticalValue.length,
                Appointment: duplicates.Appointment.length
            },
            added: {
                Opinion: filteredData.Opinion.length,
                CriticalValue: filteredData.CriticalValue.length,
                Appointment: filteredData.Appointment.length
            }
        });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createNotification = createNotification;
// Get notifications for a user on a specific date
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
        }
        targetDate.setHours(0, 0, 0, 0);
        const notifications = await notificationSchema_1.default.getNotificationsByDate(userId, targetDate);
        res.status(200).json({
            success: true,
            notifications
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getNotifications = getNotifications;
// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId, type, index } = req.params;
        console.log('Marking notification as read:', { notificationId, type, index });
        if (!notificationId || !type || index === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID, type, and index are required'
            });
        }
        const notification = await notificationSchema_1.default.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        // Validate type
        const validTypes = ['Opinion', 'CriticalValue', 'Appointment'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification type. Must be Opinion, CriticalValue, or Appointment'
            });
        }
        // Validate index
        const indexNum = parseInt(index);
        if (isNaN(indexNum) || indexNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid index. Must be a non-negative number'
            });
        }
        // Check if the notification object exists at the specified index
        const notificationArray = notification[type];
        if (!notificationArray || !notificationArray[indexNum]) {
            return res.status(404).json({
                success: false,
                message: `${type} notification at index ${indexNum} not found`
            });
        }
        // Check if already read
        if (notificationArray[indexNum].isRead) {
            return res.status(200).json({
                success: true,
                message: 'Notification is already marked as read',
                notification: notificationArray[indexNum]
            });
        }
        await notification.markNotificationAsRead(type, indexNum);
        console.log(`Successfully marked ${type} notification at index ${indexNum} as read`);
        res.status(200).json({
            success: true,
            message: 'Notification marked as read successfully',
            notification: notificationArray[indexNum]
        });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
// Mark multiple notifications as read
const markMultipleNotificationsAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { notifications } = req.body; // Array of { type, index }
        console.log('Marking multiple notifications as read:', { notificationId, notifications });
        if (!notificationId || !notifications || !Array.isArray(notifications)) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID and notifications array are required'
            });
        }
        const notification = await notificationSchema_1.default.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        const validTypes = ['Opinion', 'CriticalValue', 'Appointment'];
        const results = [];
        const errors = [];
        for (const item of notifications) {
            const { type, index } = item;
            if (!type || !validTypes.includes(type)) {
                errors.push({ type, index, error: 'Invalid notification type' });
                continue;
            }
            const indexNum = parseInt(index);
            if (isNaN(indexNum) || indexNum < 0) {
                errors.push({ type, index, error: 'Invalid index' });
                continue;
            }
            const notificationArray = notification[type];
            if (!notificationArray || !notificationArray[indexNum]) {
                errors.push({ type, index, error: 'Notification not found at specified index' });
                continue;
            }
            try {
                await notification.markNotificationAsRead(type, indexNum);
                results.push({ type, index: indexNum, success: true });
            }
            catch (error) {
                errors.push({ type, index: indexNum, error: error.message });
            }
        }
        console.log(`Marked ${results.length} notifications as read, ${errors.length} errors`);
        res.status(200).json({
            success: true,
            message: `Marked ${results.length} notifications as read`,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Error marking multiple notifications as read:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.markMultipleNotificationsAsRead = markMultipleNotificationsAsRead;
// Mark all notifications as read for a user on a specific date
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
        }
        const result = await notificationSchema_1.default.markAllAsRead(userId, targetDate);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// Clean up old notifications (admin function)
const cleanupOldNotifications = async (req, res) => {
    try {
        const result = await notificationSchema_1.default.cleanupOldNotifications();
        res.status(200).json({
            success: true,
            message: 'Old notifications cleaned up',
            deletedCount: result.deletedCount
        });
    }
    catch (error) {
        console.error('Error cleaning up old notifications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.cleanupOldNotifications = cleanupOldNotifications;
// Test endpoint to send push notification
const testPushNotification = async (req, res) => {
    try {
        const { userId, notificationType = 'Opinion' } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        // Get user's FCM token
        const user = await userSchema_1.default.findOne({ userID: userId });
        if (!user || !user.token) {
            return res.status(404).json({ success: false, message: 'User not found or no FCM token' });
        }
        const now = new Date();
        // Create test notification data
        const testData = {
            Opinion: notificationType === 'Opinion' ? [{
                    Opinions: [{ Opinion: "Test opinion request", Priority: "Normal" }],
                    Patient_Name: "Test Patient",
                    UHID: "TEST123",
                    OPIP_No: "TEST456",
                    Speciality: "General Medicine",
                    Ward: "Test Ward",
                    Bed_Type: "General",
                    Bed: "101",
                    isRead: false,
                    createdAt: now,
                    updatedAt: now
                }] : [],
            CriticalValue: notificationType === 'CriticalValue' ? [{
                    CriticalValues: [{ Investigation: "Test Investigation", Value: "Test Value" }],
                    Patient_Name: "Test Patient",
                    UHID: "TEST123",
                    OPIP_No: "TEST456",
                    Age: "30/Y",
                    Ward: "Test Ward",
                    isRead: false,
                    createdAt: now,
                    updatedAt: now
                }] : [],
            Appointment: notificationType === 'Appointment' ? [{
                    Patient_Name: "Test Patient",
                    UHID: "TEST123",
                    Age: "30",
                    Age_Type: "Years",
                    Gender: "Male",
                    App_No: "TEST789",
                    App_Date: "20-JUN-25",
                    App_Time: "14:00",
                    App_Type: "Scheduled",
                    Patient_Type: "New",
                    isRead: false,
                    createdAt: now,
                    updatedAt: now
                }] : []
        };
        // Send push notification
        await sendPatientPushNotifications(userId, testData);
        res.status(200).json({
            success: true,
            message: 'Test push notification sent successfully',
            userId,
            notificationType
        });
    }
    catch (error) {
        console.error('Error sending test push notification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.testPushNotification = testPushNotification;
// Get notification details with indices for marking as read
const getNotificationDetails = async (req, res) => {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }
        const notification = await notificationSchema_1.default.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        // Prepare detailed response with indices
        const details = {
            notificationId: notification._id,
            userId: notification.userId,
            date: notification.date,
            Opinion: notification.Opinion.map((item, index) => ({
                index,
                isRead: item.isRead,
                Patient_Name: item.Patient_Name,
                UHID: item.UHID,
                OPIP_No: item.OPIP_No,
                Speciality: item.Speciality,
                Ward: item.Ward,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            })),
            CriticalValue: notification.CriticalValue.map((item, index) => ({
                index,
                isRead: item.isRead,
                Patient_Name: item.Patient_Name,
                UHID: item.UHID,
                OPIP_No: item.OPIP_No,
                Age: item.Age,
                Ward: item.Ward,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            })),
            Appointment: notification.Appointment.map((item, index) => ({
                index,
                isRead: item.isRead,
                Patient_Name: item.Patient_Name,
                UHID: item.UHID,
                App_No: item.App_No,
                App_Date: item.App_Date,
                App_Time: item.App_Time,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }))
        };
        res.status(200).json({
            success: true,
            message: 'Notification details retrieved successfully',
            details,
            instructions: {
                markSingle: 'Use PATCH /:notificationId/:type/:index/read',
                markMultiple: 'Use PATCH /:notificationId/mark-multiple-read with body: { "notifications": [{ "type": "Opinion", "index": 0 }] }',
                validTypes: ['Opinion', 'CriticalValue', 'Appointment'],
                indexRange: 'Index starts from 0 and must be less than the array length'
            }
        });
    }
    catch (error) {
        console.error('Error getting notification details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getNotificationDetails = getNotificationDetails;
