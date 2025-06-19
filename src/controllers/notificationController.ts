import { Request, Response } from 'express';
import admin from '../firebase/firebaseAdmin';

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
