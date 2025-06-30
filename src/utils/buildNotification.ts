interface ChatNotificationPayload {
    recipientToken: string;
    senderName: string;
    messageText: string;
    chatRoomId?: string;
    groupName?: string;
    messageType: 'text' | 'image' | 'voice' | 'file' | 'document' | 'video';
    isGroup?: boolean;
  }

interface PatientNotificationPayload {
    recipientToken: string;
    notificationType: 'Opinion' | 'CriticalValue' | 'Appointment';
    patientName: string;
    count: number;
    priority?: string;
    ward?: string;
    speciality?: string;
  }
  
  export const buildChatNotificationMessage = ({
    recipientToken,
    senderName,
    messageText,
    chatRoomId = '',
    groupName = '',
    messageType,
    isGroup = false,
  }: ChatNotificationPayload) => {
    const navigationId = chatRoomId ? `ChatRoom:${chatRoomId}` : 'Chats';
  
    let body = messageText;
    switch (messageType) {
      case 'image': body = '📷 Sent an image'; break;
      case 'voice': body = '🎤 Sent a voice message'; break;
      case 'file': body = '📎 Sent a file'; break;
      case 'document': body = '📄 Sent a document'; break;
      case 'video': body = '🎥 Sent a video'; break;
      default:
        if (messageText.length > 50) {
          body = messageText.slice(0, 47) + '...';
        }
    }
  
    const title = isGroup
      ? `${senderName} in ${groupName}`
      : `New message from ${senderName}`;
  
    return {
      token: recipientToken,
      notification: {
        title,
        body,
      },
      data: {
        type: isGroup ? 'group_chat' : 'chat',
        senderName,
        groupName,
        messageText,
        messageType,
        chatRoomId,
        navigationId,
        timestamp: new Date().toISOString(),
      },
      android: {
        notification: {
          channelId: isGroup ? 'group_chat_messages' : 'chat_messages',
          sound: 'default',
          icon: 'ic_stat_name',
          priority: 'high' as const,
          vibrateTimingsMillis: [0, 250, 250, 250],
          defaultVibrateTimings: false,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
            category: isGroup ? 'group_chat_message' : 'chat_message',
          },
        },
      },
    };
  };

  export const buildPatientNotificationMessage = ({
    recipientToken,
    notificationType,
    patientName,
    count,
    priority,
    ward,
    speciality,
  }: PatientNotificationPayload) => {
    let title = '';
    let body = '';
    let channelId = '';

    switch (notificationType) {
      case 'Opinion':
        title = `🩺 New Opinion Request${count > 1 ? `s (${count})` : ''}`;
        body = `${patientName}${count > 1 ? ` and ${count - 1} other patient(s)` : ''} need your opinion`;
        channelId = 'patient_opinions';
        break;
      
      case 'CriticalValue':
        title = `⚠️ Critical Value Alert${count > 1 ? `s (${count})` : ''}`;
        body = `Critical values detected for ${patientName}${count > 1 ? ` and ${count - 1} other patient(s)` : ''}`;
        channelId = 'critical_values';
        break;
      
      case 'Appointment':
        title = `📅 New Appointment${count > 1 ? `s (${count})` : ''}`;
        body = `${patientName}${count > 1 ? ` and ${count - 1} other patient(s)` : ''} have scheduled appointments`;
        channelId = 'appointments';
        break;
    }

    return {
      token: recipientToken,
      notification: {
        title,
        body,
      },
      data: {
        type: 'patient_notification',
        notificationType,
        patientName,
        count: count.toString(),
        priority: priority || '',
        ward: ward || '',
        speciality: speciality || '',
        navigationId: 'Notifications',
        timestamp: new Date().toISOString(),
      },
      android: {
        notification: {
          channelId,
          sound: 'default',
          icon: 'ic_stat_name',
          priority: (notificationType === 'CriticalValue' ? 'high' : 'default') as 'high' | 'default',
          vibrateTimingsMillis: notificationType === 'CriticalValue' ? [0, 500, 250, 500] : [0, 250, 250, 250],
          defaultVibrateTimings: false,
          color: notificationType === 'CriticalValue' ? '#FF0000' : '#2196F3',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
            category: `patient_${notificationType.toLowerCase()}`,
          },
        },
      },
    };
  };
  