# Notification API Guide

This guide explains how to use the notification system for storing and managing patient notifications including Opinions, Critical Values, and Appointments.

## Overview

The notification system stores daily notifications for each user. Notifications are automatically cleaned up after 24 hours using MongoDB's TTL (Time To Live) index. **Push notifications are automatically sent when new notifications are created.**

## Push Notifications

When you create notifications using the `/api/notification/create` endpoint, the system automatically sends push notifications to the user's device based on their FCM token stored in the user schema.

### Push Notification Types

1. **🩺 Opinion Notifications**: "New Opinion Request(s) - Patient needs your opinion"
2. **⚠️ Critical Value Alerts**: "Critical Value Alert(s) - Critical values detected for Patient" (High priority)
3. **📅 Appointment Notifications**: "New Appointment(s) - Patient has scheduled appointments"

### Push Notification Features

- **Different Channels**: Each notification type has its own notification channel
- **Priority Levels**: Critical values get high priority notifications
- **Vibration Patterns**: Different vibration patterns for different notification types
- **Colors**: Critical values show in red, others in blue
- **Navigation**: Tapping notification navigates to the Notifications screen

## Data Structure

The notification data structure supports three types of notifications:

### 1. Opinion Notifications
```json
{
  "Opinion": [
    {
      "Opinions": [
        {
          "Opinion": "KINDLY NEED YOUR OPINION SIR",
          "Priority": "Normal"
        }
      ],
      "Patient_Name": "Mrs.Kairunnisha Begam Mohamed Gani,63Y/F",
      "UHID": "TN250000489533",
      "OPIP_No": "IPTN00086615",
      "Speciality": "Surgical Oncologist",
      "Ward": "B III Floor",
      "Bed_Type": "General Ward",
      "Bed": "355-2"
    }
  ]
}
```

### 2. Critical Value Notifications
```json
{
  "CriticalValue": [
    {
      "CriticalValues": [
        {
          "Investigation": "Blood Glucose Fasting (FBS)",
          "Value": "83 mg/dL"
        },
        {
          "Investigation": "Albumin, Serum",
          "Value": "2.4 g/dl"
        }
      ],
      "Patient_Name": "Mrs.Vijayakumari Sivaprakasam",
      "UHID": "TN240000478846",
      "OPIP_No": "IPTN00086316",
      "Age": "66/Y",
      "Ward": "Pre OW"
    }
  ]
}
```

### 3. Appointment Notifications
```json
{
  "Appointment": [
    {
      "Patient_Name": "Muthukkumaran M",
      "UHID": "TN170000222822",
      "Age": "52",
      "Age_Type": "Years",
      "Gender": "Male",
      "App_No": "TN178534",
      "App_Date": "19-JUN-25",
      "App_Time": "13:21",
      "App_Type": "Walk-in",
      "Patient_Type": "Existing"
    }
  ]
}
```

## API Endpoints

### 1. Create/Update Notifications (with Push Notifications)
**POST** `/api/notification/create`

Creates or updates notifications for a user for the current date. **Automatically sends push notifications for new notifications.**

**Request Body:**
```json
{
  "userId": "doctor123",
  "Opinion": [...],
  "CriticalValue": [...],
  "Appointment": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification created/updated successfully",
  "notification": {
    "_id": "...",
    "userId": "doctor123",
    "date": "2024-01-15T00:00:00.000Z",
    "Opinion": [...],
    "CriticalValue": [...],
    "Appointment": [...],
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Test Push Notifications
**POST** `/api/notification/test-push`

Send a test push notification to verify the system is working.

**Request Body:**
```json
{
  "userId": "doctor123",
  "notificationType": "Opinion" // "Opinion", "CriticalValue", or "Appointment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test push notification sent successfully",
  "userId": "doctor123",
  "notificationType": "Opinion"
}
```

### 3. Get Notifications
**GET** `/api/notification/user/:userId?date=2024-01-15`

Retrieves notifications for a specific user and date (defaults to current date).

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "userId": "doctor123",
      "date": "2024-01-15T00:00:00.000Z",
      "Opinion": [...],
      "CriticalValue": [...],
      "Appointment": [...],
      "isRead": false
    }
  ]
}
```

### 4. Mark Notification as Read
**PATCH** `/api/notification/:notificationId/read`

Marks a specific notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 5. Mark All Notifications as Read
**PATCH** `/api/notification/user/:userId/read-all?date=2024-01-15`

Marks all notifications for a user on a specific date as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 3
}
```

### 6. Cleanup Old Notifications
**DELETE** `/api/notification/cleanup`

Manually triggers cleanup of notifications older than 24 hours (admin function).

**Response:**
```json
{
  "success": true,
  "message": "Old notifications cleaned up",
  "deletedCount": 15
}
```

## Usage Examples

### Frontend Integration

```javascript
// Create notifications for today (automatically sends push notifications)
const createNotifications = async (userId, notificationData) => {
  const response = await fetch('/api/notification/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ...notificationData
    })
  });
  return response.json();
};

// Test push notifications
const testPushNotification = async (userId, notificationType) => {
  const response = await fetch('/api/notification/test-push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      notificationType
    })
  });
  return response.json();
};

// Get today's notifications
const getTodayNotifications = async (userId) => {
  const response = await fetch(`/api/notification/user/${userId}`);
  return response.json();
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  const response = await fetch(`/api/notification/user/${userId}/read-all`, {
    method: 'PATCH'
  });
  return response.json();
};
```

### Complete Example with Push Notifications

```javascript
// Example of sending the notification data you provided
const notificationData = {
  userId: "doctor123",
  Opinion: [
    {
      Opinions: [
        {
          Opinion: "KINDLY NEED YOUR OPINION SIR",
          Priority: "Normal"
        }
      ],
      Patient_Name: "Mrs.Kairunnisha Begam Mohamed Gani,63Y/F",
      UHID: "TN250000489533",
      OPIP_No: "IPTN00086615",
      Speciality: "Surgical Oncologist",
      Ward: "B III Floor",
      Bed_Type: "General Ward",
      Bed: "355-2"
    }
  ],
  CriticalValue: [
    {
      CriticalValues: [
        {
          Investigation: "Blood Glucose Fasting (FBS)",
          Value: "83 mg/dL"
        }
      ],
      Patient_Name: "Mrs.Vijayakumari Sivaprakasam",
      UHID: "TN240000478846",
      OPIP_No: "IPTN00086316",
      Age: "66/Y",
      Ward: "Pre OW"
    }
  ],
  Appointment: [
    {
      Patient_Name: "Muthukkumaran M",
      UHID: "TN170000222822",
      Age: "52",
      Age_Type: "Years",
      Gender: "Male",
      App_No: "TN178534",
      App_Date: "19-JUN-25",
      App_Time: "13:21",
      App_Type: "Walk-in",
      Patient_Type: "Existing"
    }
  ]
};

// Send to backend - this will automatically send push notifications
const result = await createNotifications("doctor123", notificationData);
console.log(result);

// Test push notifications
await testPushNotification("doctor123", "CriticalValue");
```

## Features

1. **Daily Storage**: Notifications are stored per user per day
2. **Automatic Cleanup**: Notifications are automatically deleted after 24 hours
3. **Read Status Tracking**: Track which notifications have been read
4. **Flexible Data Structure**: Support for multiple notification types
5. **Efficient Queries**: Indexed for fast retrieval by user and date
6. **Automatic Push Notifications**: Push notifications sent when new notifications are created
7. **Different Notification Channels**: Separate channels for different notification types
8. **Priority Levels**: Critical values get high priority notifications

## Database Schema

The notification schema includes:
- `userId`: User identifier
- `date`: Date of the notification (start of day)
- `Opinion`: Array of opinion notifications
- `CriticalValue`: Array of critical value notifications
- `Appointment`: Array of appointment notifications
- `isRead`: Boolean flag for read status
- `createdAt`/`updatedAt`: Timestamps
- TTL index for automatic cleanup after 24 hours

## User Schema Requirements

For push notifications to work, users must have:
- `userID`: Unique user identifier
- `token`: FCM token for push notifications

```json
{
  "userID": "doctor123",
  "name": "Dr. Smith",
  "token": "fcm_token_here",
  "department": "Cardiology"
}
``` 