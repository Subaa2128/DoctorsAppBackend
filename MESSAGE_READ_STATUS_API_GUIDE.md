# Message Read Status API Guide

This guide explains how to use the message read status functionality in the Doctors App Backend.

## Overview

The read status feature allows tracking which users have read specific messages. Each message now includes a `readBy` array that contains information about who has read the message and when. **Important: Each user can only mark a message as read once - duplicate entries are prevented.**

## Message Schema Changes

Messages now include a `readBy` field:

```typescript
interface IReadStatus {
  userID: string;
  readAt: Date;
}

interface IMessage {
  // ... existing fields
  readBy: IReadStatus[]; // Array of users who have read this message
}
```

## API Endpoints

### 1. Mark Single Message as Read

**POST** `/api/messages/read/:messageID`

Marks a specific message as read by a user. **If the user has already read the message, no duplicate entry is created.**

**Request Body:**
```json
{
  "userID": "user123"
}
```

**Response (Newly Marked):**
```json
{
  "message": "Message marked as read successfully",
  "data": {
    "messageID": "message_id_here",
    "readBy": [
      {
        "userID": "user123",
        "readAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "alreadyRead": false,
    "readAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Already Read):**
```json
{
  "message": "Message already marked as read",
  "data": {
    "messageID": "message_id_here",
    "readBy": [
      {
        "userID": "user123",
        "readAt": "2024-01-15T10:25:00.000Z"
      }
    ],
    "alreadyRead": true,
    "readAt": "2024-01-15T10:25:00.000Z"
  }
}
```

### 2. Mark Multiple Messages as Read

**POST** `/api/messages/read-multiple`

Marks multiple messages as read by a user in a single request. **Prevents duplicates and provides detailed feedback.**

**Request Body:**
```json
{
  "messageIDs": ["message1", "message2", "message3"],
  "userID": "user123"
}
```

**Response:**
```json
{
  "message": "Messages processed successfully",
  "data": {
    "totalProcessed": 3,
    "newlyMarked": 2,
    "alreadyRead": 1,
    "notFound": 0,
    "details": {
      "newlyMarked": ["message1", "message2"],
      "alreadyRead": ["message3"],
      "notFound": []
    },
    "userID": "user123"
  }
}
```

### 3. Get Unread Message Count

**GET** `/api/messages/unread/count/:userID`

Gets the count of unread messages for a user.

**Query Parameters:**
- `roomID` (optional): Filter by specific group chat
- `recipientID` (optional): Filter by specific 1-to-1 chat

**Examples:**
```
GET /api/messages/unread/count/user123
GET /api/messages/unread/count/user123?roomID=group456
GET /api/messages/unread/count/user123?recipientID=user789
```

**Response:**
```json
{
  "unreadCount": 5,
  "userID": "user123",
  "filter": "all" // or "room" or "recipient"
}
```

### 4. Get Unread Messages

**GET** `/api/messages/unread/:userID`

Gets the actual unread messages for a user.

**Query Parameters:**
- `roomID` (optional): Filter by specific group chat
- `recipientID` (optional): Filter by specific 1-to-1 chat
- `limit` (optional): Number of messages to return (default: 50)

**Examples:**
```
GET /api/messages/unread/user123
GET /api/messages/unread/user123?roomID=group456&limit=20
GET /api/messages/unread/user123?recipientID=user789
```

**Response:**
```json
{
  "unreadMessages": [
    {
      "_id": "message_id",
      "senderID": "sender123",
      "text": "Hello!",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "readBy": [],
      "isRead": false
    }
  ],
  "count": 1,
  "userID": "user123"
}
```

## Updated Existing Endpoints

### Chat History Endpoints

The existing chat history endpoints now include read status information:

**GET** `/api/messages/history/single/:user1/:user2`

**Query Parameters:**
- `currentUserID`: The ID of the current user to check read status

**Response includes:**
```json
{
  "_id": "message_id",
  "senderID": "sender123",
  "text": "Hello!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "isRead": true,
  "readBy": [
    {
      "userID": "user123",
      "readAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**GET** `/api/messages/history/group/:roomID`

**Query Parameters:**
- `userID`: The ID of the user to check read status

**Response includes the same read status information as above.**

## Usage Examples

### Frontend Implementation

```javascript
// Mark a message as read when user opens a chat
async function markMessageAsRead(messageID, userID) {
  try {
    const response = await fetch(`/api/messages/read/${messageID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userID })
    });
    const result = await response.json();
    
    if (result.data.alreadyRead) {
      console.log('Message was already read at:', result.data.readAt);
    } else {
      console.log('Message newly marked as read at:', result.data.readAt);
    }
    
    return result;
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

// Mark multiple messages as read (e.g., when opening a chat)
async function markMessagesAsRead(messageIDs, userID) {
  try {
    const response = await fetch('/api/messages/read-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIDs, userID })
    });
    const result = await response.json();
    
    console.log(`Processed ${result.data.totalProcessed} messages:`);
    console.log(`- Newly marked: ${result.data.newlyMarked}`);
    console.log(`- Already read: ${result.data.alreadyRead}`);
    console.log(`- Not found: ${result.data.notFound}`);
    
    return result;
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Get unread count for notifications
async function getUnreadCount(userID, roomID = null) {
  try {
    const url = roomID 
      ? `/api/messages/unread/count/${userID}?roomID=${roomID}`
      : `/api/messages/unread/count/${userID}`;
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error getting unread count:', error);
  }
}

// Get chat history with read status
async function getChatHistory(user1, user2, currentUserID) {
  try {
    const response = await fetch(
      `/api/messages/history/single/${user1}/${user2}?currentUserID=${currentUserID}`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting chat history:', error);
  }
}
```

### Real-time Updates

For real-time applications, you can:

1. **Mark messages as read when they appear in the viewport**
2. **Update read status when user scrolls to a message**
3. **Show read receipts in the UI**
4. **Update notification badges based on unread counts**

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (missing required fields)
- `404`: Message not found
- `500`: Server error

Error responses include a message and error details:

```json
{
  "message": "Error message here",
  "error": "Detailed error information"
}
```

## Key Features

### 1. **Duplicate Prevention**
- Each user can only mark a message as read once
- No duplicate entries in the `readBy` array
- Clear feedback when a message is already read

### 2. **Detailed Feedback**
- Single message endpoint tells you if it was newly marked or already read
- Multiple messages endpoint provides counts and lists of each category
- Includes timestamps for when messages were first read

### 3. **Performance Optimized**
- Efficient queries to prevent unnecessary database operations
- Batch processing for multiple messages
- Proper error handling and validation

## Notes

1. **Performance**: The read status is stored as an array in each message. For high-traffic applications, consider implementing a separate read status collection.

2. **Privacy**: Read status is only visible to users who are members of the chat (for group chats) or participants (for 1-to-1 chats).

3. **Automatic Marking**: Consider automatically marking messages as read when:
   - User opens a chat
   - User scrolls to a message
   - User is actively viewing the chat

4. **Batch Operations**: Use the `markMessagesAsRead` endpoint for better performance when marking multiple messages as read.

5. **Caching**: Consider caching unread counts on the frontend to reduce API calls.

6. **Duplicate Prevention**: The system automatically prevents duplicate read entries, so you can safely call the read endpoints multiple times without worrying about data integrity. 