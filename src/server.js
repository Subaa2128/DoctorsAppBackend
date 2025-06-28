// server.js
const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./kauverydoctorsapp-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json());

app.post('/send-notification', async (req, res) => {
  const { token, title, body, navigationId } = req.body;

  const message = {
    token,
    notification: { title, body },
    data: { navigationId: navigationId ?? 'Dashboard' },
    android: {
      notification: {
        channelId: 'hi',
        sound: 'default',
        icon: 'ic_stat_name'
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(response)
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
