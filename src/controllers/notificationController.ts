import { Request, Response } from 'express';
import admin from '../firebase/firebaseAdmin';
import { buildChatNotificationMessage, buildPatientNotificationMessage } from '../utils/buildNotification';
import notificationSchema from '../schema/notificationSchema';
import userSchema from '../schema/userSchema';

export const sendNotification = async (req: Request, res: Response) => {
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
    const response = await admin.messaging().send(message);
    console.log('FCM response:', response);
    res.json({ success: true, response });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const sendChatPushNotification = async (req: Request, res: Response) => {
  try {
    const {
      recipientToken,
      senderName,
      messageText,
      chatRoomId,
      groupName,
      messageType = 'text',
      isGroup = false,
    } = req.body;

    if (!recipientToken || !senderName || !messageText) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const message = buildChatNotificationMessage({
      recipientToken,
      senderName,
      groupName,
      messageText,
      chatRoomId,
      messageType,
      isGroup,
    });

    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    res.status(200).json({ success: true, response });

  } catch (error: any) {
    console.error('Notification send failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to send push notifications for patient notifications
const sendPatientPushNotifications = async (userId: string, notificationData: any) => {
  try {
    // Get user's FCM token
    const user = await userSchema.findOne({ userID: userId });
    if (!user || !user.token) {
      console.log(`No FCM token found for user: ${userId}`);
      return;
    }

    const notifications = [];

    // Send notification for Opinions
    if (notificationData.Opinion && notificationData.Opinion.length > 0) {
      const firstOpinion = notificationData.Opinion[0];
      const message = buildPatientNotificationMessage({
        recipientToken: user.token,
        notificationType: 'Opinion',
        patientName: firstOpinion.Patient_Name,
        count: notificationData.Opinion.length,
        priority: firstOpinion.Opinions?.[0]?.Priority,
        ward: firstOpinion.Ward,
        speciality: firstOpinion.Speciality,
      });
      notifications.push(admin.messaging().send(message));
    }

    // Send notification for Critical Values
    if (notificationData.CriticalValue && notificationData.CriticalValue.length > 0) {
      const firstCriticalValue = notificationData.CriticalValue[0];
      const message = buildPatientNotificationMessage({
        recipientToken: user.token,
        notificationType: 'CriticalValue',
        patientName: firstCriticalValue.Patient_Name,
        count: notificationData.CriticalValue.length,
        ward: firstCriticalValue.Ward,
      });
      notifications.push(admin.messaging().send(message));
    }

    // Send notification for Appointments
    if (notificationData.Appointment && notificationData.Appointment.length > 0) {
      const firstAppointment = notificationData.Appointment[0];
      const message = buildPatientNotificationMessage({
        recipientToken: user.token,
        notificationType: 'Appointment',
        patientName: firstAppointment.Patient_Name,
        count: notificationData.Appointment.length,
      });
      notifications.push(admin.messaging().send(message));
    }

    // Send all notifications
    if (notifications.length > 0) {
      const results = await Promise.allSettled(notifications);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Push notification sent successfully for user ${userId}`);
        } else {
          console.error(`Failed to send push notification for user ${userId}:`, result.reason);
        }
      });
    }

  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};

// Create or update notifications for a user
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, Opinion, CriticalValue, Appointment } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    console.log('Request body:', { userId, Opinion: Opinion?.length, CriticalValue: CriticalValue?.length, Appointment: Appointment?.length });

    // Normalize and fill missing fields with default values
    const normalizeOpinionData = (items: any[]) => {
      if (!items || items.length === 0) return [];
      
      return items.map((item: any) => ({
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

    const normalizeCriticalValueData = (items: any[]) => {
      if (!items || items.length === 0) return [];
      
      return items.map((item: any) => ({
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

    const normalizeAppointmentData = (items: any[]) => {
      if (!items || items.length === 0) return [];
      
      return items.map((item: any) => ({
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
    const checkForDuplicates = async (normalizedData: any) => {
      const duplicates = {
        Opinion: [] as any[],
        CriticalValue: [] as any[],
        Appointment: [] as any[]
      };

      // Get all notifications for this user
      const allNotifications = await notificationSchema.find({ userId });
      
      // Check Opinion duplicates
      if (normalizedData.Opinion && normalizedData.Opinion.length > 0) {
        for (const newOpinion of normalizedData.Opinion) {
          const isDuplicate = allNotifications.some(notification => 
            notification.Opinion.some(existingOpinion => 
              existingOpinion.Patient_Name === newOpinion.Patient_Name &&
              existingOpinion.UHID === newOpinion.UHID &&
              existingOpinion.OPIP_No === newOpinion.OPIP_No
            )
          );
          if (isDuplicate) {
            duplicates.Opinion.push(newOpinion);
          }
        }
      }

      // Check CriticalValue duplicates
      if (normalizedData.CriticalValue && normalizedData.CriticalValue.length > 0) {
        for (const newCriticalValue of normalizedData.CriticalValue) {
          const isDuplicate = allNotifications.some(notification => 
            notification.CriticalValue.some(existingCriticalValue => 
              existingCriticalValue.Patient_Name === newCriticalValue.Patient_Name &&
              existingCriticalValue.UHID === newCriticalValue.UHID &&
              existingCriticalValue.OPIP_No === newCriticalValue.OPIP_No
            )
          );
          if (isDuplicate) {
            duplicates.CriticalValue.push(newCriticalValue);
          }
        }
      }

      // Check Appointment duplicates
      if (normalizedData.Appointment && normalizedData.Appointment.length > 0) {
        for (const newAppointment of normalizedData.Appointment) {
          const isDuplicate = allNotifications.some(notification => 
            notification.Appointment.some(existingAppointment => 
              existingAppointment.Patient_Name === newAppointment.Patient_Name &&
              existingAppointment.App_No === newAppointment.App_No &&
              existingAppointment.App_Date === newAppointment.App_Date
            )
          );
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
    let notification = await notificationSchema.findOne({
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
    const prepareNotificationData = (items: any[], normalizer: (items: any[]) => any[]) => {
      if (!items || items.length === 0) return [];
      
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
      Opinion: normalizedData.Opinion.filter(item => 
        !duplicates.Opinion.some(dup => 
          dup.Patient_Name === item.Patient_Name &&
          dup.UHID === item.UHID &&
          dup.OPIP_No === item.OPIP_No
        )
      ),
      CriticalValue: normalizedData.CriticalValue.filter(item => 
        !duplicates.CriticalValue.some(dup => 
          dup.Patient_Name === item.Patient_Name &&
          dup.UHID === item.UHID &&
          dup.OPIP_No === item.OPIP_No
        )
      ),
      Appointment: normalizedData.Appointment.filter(item => 
        !duplicates.Appointment.some(dup => 
          dup.Patient_Name === item.Patient_Name &&
          dup.App_No === item.App_No &&
          dup.App_Date === item.App_Date
        )
      )
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
    } else {
      console.log('Creating new notification');
      
      // Create new notification
      notification = new notificationSchema({
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

  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get notifications for a user on a specific date
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
    }
    targetDate.setHours(0, 0, 0, 0);    
    const notifications = await notificationSchema.getNotificationsByDate(userId, targetDate);

    res.status(200).json({ 
      success: true, 
      notifications 
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Clean up old notifications (admin function)
export const cleanupOldNotifications = async (req: Request, res: Response) => {
  try {
    const result = await notificationSchema.cleanupOldNotifications();

    res.status(200).json({ 
      success: true, 
      message: 'Old notifications cleaned up',
      deletedCount: result.deletedCount 
    });

  } catch (error: any) {
    console.error('Error cleaning up old notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark a specific notification item as read
export const markNotificationItemAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId, type, itemId } = req.body;
    console.log(notificationId,type,itemId)

    if (!notificationId || !type || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Notification ID, type, and item ID are required' 
      });
    }

    // Validate notification type
    const validTypes = ['Opinion', 'CriticalValue', 'Appointment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid notification type. Must be one of: Opinion, CriticalValue, Appointment' 
      });
    }

    // Use the static method to mark specific notification item as read by _id
    const result = await notificationSchema.markNotificationAsReadById(notificationId, type, itemId);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification item not found or already marked as read' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Notification item marked as read successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Error marking notification item as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark all notifications as read for a user on a specific date
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
    }
    targetDate.setHours(0, 0, 0, 0);

    const result = await notificationSchema.markAllAsRead(userId, targetDate);

    res.status(200).json({ 
      success: true, 
      message: 'All notifications marked as read successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


