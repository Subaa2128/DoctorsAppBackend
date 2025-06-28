import admin from 'firebase-admin';
import path from 'path';

// Path to your service account key file
const serviceAccount = require(path.resolve(__dirname, '../../kauverydoctorsapp-firebase-adminsdk.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
