# Notification Read API Guide

This guide explains how to use the notification read functionality to mark notifications as read when users view them.

## API Endpoints

### 1. Mark Individual Notification Item as Read

**Endpoint:** `PUT /api/notifications/mark-item-read`

**Description:** Marks a specific notification item as read when a user views it.

**Request Body:**
```json
{
  "notificationId": "notification_document_id",
  "type": "Appointment",
  "itemId": "685f78e4994deaba2b9141d9"
}
```

**Parameters:**
- `notificationId` (string, required): The ID of the notification document
- `type` (string, required): The type of notification - must be one of: "Opinion", "CriticalValue", "Appointment"
- `itemId` (string, required): The `_id` of the specific notification item to mark as read

**Example Request:**
```javascript
// Mark the specific appointment notification as read
fetch('/api/notifications/mark-item-read', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notificationId: "notification_document_id_here",
    type: "Appointment",
    itemId: "685f78e4994deaba2b9141d9"
  })
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification item marked as read successfully",
  "modifiedCount": 1
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid notification type
- `404 Not Found`: Notification item not found or already marked as read
- `500 Internal Server Error`: Server error

### 2. Mark All Notifications as Read for a User

**Endpoint:** `PUT /api/notifications/user/:userId/mark-all-read`

**Description:** Marks all notifications as read for a specific user on a given date.

**URL Parameters:**
- `userId` (string, required): The user ID

**Query Parameters:**
- `date` (string, optional): The date in ISO format (defaults to current date)

**Example Request:**
```javascript
// Mark all notifications as read for today
fetch('/api/notifications/user/12345/mark-all-read', {
  method: 'PUT'
});

// Mark all notifications as read for a specific date
fetch('/api/notifications/user/12345/mark-all-read?date=2025-06-28', {
  method: 'PUT'
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read successfully",
  "modifiedCount": 5
}
```

## Usage Examples

### Frontend Integration

```javascript
// Function to mark a notification item as read
async function markNotificationAsRead(notificationId, type, itemId) {
  try {
    const response = await fetch('/api/notifications/mark-item-read', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId,
        type,
        itemId
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Notification marked as read successfully');
      // Update UI to reflect the change
      updateNotificationUI(itemId, true);
    } else {
      console.error('Failed to mark notification as read:', result.message);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Function to mark all notifications as read
async function markAllNotificationsAsRead(userId, date = null) {
  try {
    const url = date 
      ? `/api/notifications/user/${userId}/mark-all-read?date=${date}`
      : `/api/notifications/user/${userId}/mark-all-read`;

    const response = await fetch(url, {
      method: 'PUT'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('All notifications marked as read successfully');
      // Update UI to reflect all notifications as read
      updateAllNotificationsUI(true);
    } else {
      console.error('Failed to mark all notifications as read:', result.message);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Example usage when user clicks on a notification
function onNotificationClick(notificationData) {
  // Mark the specific notification as read
  markNotificationAsRead(
    notificationData.notificationId,
    notificationData.type,
    notificationData.itemId
  );
  
  // Navigate to the notification details or perform other actions
  navigateToNotificationDetails(notificationData);
}
```

### React Component Example

```jsx
import React, { useState } from 'react';

const NotificationItem = ({ notification, notificationId }) => {
  const [isRead, setIsRead] = useState(notification.isRead);

  const handleNotificationClick = async () => {
    try {
      const response = await fetch('/api/notifications/mark-item-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          type: 'Appointment', // or 'Opinion', 'CriticalValue'
          itemId: notification._id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsRead(true);
        // Additional UI updates or navigation
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div 
      className={`notification-item ${isRead ? 'read' : 'unread'}`}
      onClick={handleNotificationClick}
    >
      <h3>{notification.Patient_Name}</h3>
      <p>Appointment: {notification.App_Date} at {notification.App_Time}</p>
      {!isRead && <span className="unread-indicator">New</span>}
    </div>
  );
};
```

## Data Structure

The notification items have the following structure:

```json
{
  "Patient_Name": "Vijay Ananth K",
  "UHID": "KM250000057962",
  "Age": "44",
  "Age_Type": "Years",
  "Gender": "Male",
  "App_No": "KM099880",
  "App_Date": "28-JUN-25",
  "App_Time": "12:00",
  "App_Type": "Walk-in",
  "Patient_Type": "Existing",
  "isRead": false,
  "createdAt": "2025-06-28T05:08:52.105+00:00",
  "updatedAt": "2025-06-28T05:08:52.105+00:00",
  "_id": "685f78e4994deaba2b9141d9"
}
```

## Best Practices

1. **Call the API when user interacts with notification**: Mark notifications as read when users click, tap, or otherwise interact with them.

2. **Handle errors gracefully**: Always handle API errors and provide user feedback.

3. **Update UI immediately**: Update the UI to show the notification as read before waiting for the API response for better user experience.

4. **Batch operations**: Use the "mark all as read" endpoint when users want to mark multiple notifications as read at once.

5. **Validate data**: Ensure you're passing the correct notification type and IDs.

## Error Handling

Common error scenarios and how to handle them:

- **404 Not Found**: The notification item doesn't exist or has already been marked as read
- **400 Bad Request**: Missing required fields or invalid notification type
- **500 Internal Server Error**: Server-side error, retry the request

Always check the response status and handle errors appropriately in your frontend code. 