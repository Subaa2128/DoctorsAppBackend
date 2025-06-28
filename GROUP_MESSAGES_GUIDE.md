# Group Messages Handling Guide

This guide explains how to handle group messages in the Doctors App Backend.

## Overview

The system supports both 1-to-1 and group messaging. Group messages are handled through chat rooms where multiple users can participate in conversations.

## Key Components

### 1. Message Schema
- `senderID`: ID of the user sending the message
- `recipientID`: For 1-to-1 messages (optional for group messages)
- `roomID`: For group messages (references ChatRoom)
- `text`: Message content
- `media`: Array of media attachments
- `timestamp`: When the message was sent

### 2. ChatRoom Schema
- `name`: Group name
- `members`: Array of group members with their details
- `isGroup`: Boolean flag (true for groups)
- `groupCreaterId`: ID of the user who created the group

## API Endpoints

### Sending Messages

#### Group Message
```http
POST /api/messages/send
Content-Type: application/json

{
  "senderID": "user123",
  "roomID": "room456",
  "text": "Hello everyone!",
  "media": [
    {
      "type": "image",
      "fileName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "base64": "data:image/jpeg;base64,..."
    }
  ]
}
```

#### 1-to-1 Message
```http
POST /api/messages/send
Content-Type: application/json

{
  "senderID": "user123",
  "recipientID": "user456",
  "text": "Hello!",
  "media": []
}
```

### Retrieving Group Chat History

```http
GET /api/messages/history/group/:roomID?skip=0&limit=20&userID=user123
```

**Query Parameters:**
- `skip`: Number of messages to skip (for pagination)
- `limit`: Number of messages to return (default: 20)
- `userID`: Optional - to verify user is a group member

**Response:**
```json
{
  "messages": [...],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 150,
    "hasMore": true
  },
  "groupInfo": {
    "name": "Doctors Team",
    "memberCount": 5
  }
}
```

### Group Management

#### Get Group Members
```http
GET /api/messages/group/members/:roomID?userID=user123
```

#### Get User's Groups
```http
GET /api/messages/user/groups/:userID
```

#### Get Recent Group Messages (for preview)
```http
GET /api/messages/group/recent/:roomID?limit=5
```

## Validation Rules

### Group Message Validation
1. **Room Existence**: Room must exist in the database
2. **Membership**: Sender must be a member of the group
3. **Group Type**: Room must be marked as a group (`isGroup: true`)
4. **Content**: Message must contain either text or media
5. **Sender**: Sender ID is required

### Error Responses

#### 400 Bad Request
```json
{
  "message": "Missing required fields"
}
```

#### 403 Forbidden
```json
{
  "message": "You are not a member of this group"
}
```

#### 404 Not Found
```json
{
  "message": "Chat room not found"
}
```

## Media Handling

Group messages support multiple media types:
- **Images**: `type: "image"`
- **Videos**: `type: "video"` (with optional `duration`)
- **Voice**: `type: "voice"` (with optional `duration`)
- **Files**: `type: "file"`
- **Documents**: `type: "document"`

### Media Object Structure
```json
{
  "type": "image",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "size": 1024000,
  "url": "base64_encoded_data",
  "duration": 30 // for video/voice files
}
```

## Best Practices

### 1. Pagination
Always use pagination for group chat history to avoid loading too many messages at once:
- Default limit: 20 messages
- Use `skip` parameter for pagination
- Check `hasMore` flag in response

### 2. Member Validation
Always validate that the user is a member before allowing access to group data:
- Use `userID` query parameter for validation
- Return 403 if user is not a member

### 3. Error Handling
- Provide clear error messages
- Log errors for debugging
- Use appropriate HTTP status codes

### 4. Performance
- Use database indexes on `roomID` and `timestamp`
- Implement caching for frequently accessed group data
- Consider using WebSockets for real-time messaging

## Example Usage

### Frontend Integration

```javascript
// Send a group message
const sendGroupMessage = async (roomID, text, media = []) => {
  const response = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderID: currentUser.id,
      roomID: roomID,
      text: text,
      media: media
    })
  });
  return response.json();
};

// Get group chat history
const getGroupHistory = async (roomID, skip = 0, limit = 20) => {
  const response = await fetch(
    `/api/messages/history/group/${roomID}?skip=${skip}&limit=${limit}&userID=${currentUser.id}`
  );
  return response.json();
};

// Get group members
const getGroupMembers = async (roomID) => {
  const response = await fetch(`/api/messages/group/members/${roomID}?userID=${currentUser.id}`);
  return response.json();
};
```

## Security Considerations

1. **Authentication**: Ensure all endpoints require proper authentication
2. **Authorization**: Validate user membership before allowing access
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Implement rate limiting to prevent spam
5. **Media Validation**: Validate file types and sizes before processing

## Troubleshooting

### Common Issues

1. **403 Forbidden**: User is not a member of the group
2. **404 Not Found**: Room ID doesn't exist
3. **400 Bad Request**: Missing required fields or invalid data
4. **500 Internal Server Error**: Database connection issues

### Debug Tips

1. Check console logs for detailed error messages
2. Verify room ID exists in the database
3. Confirm user is a member of the group
4. Validate request body structure
5. Check database connection and indexes 