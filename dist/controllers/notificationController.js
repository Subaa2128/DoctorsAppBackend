"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const firebaseAdmin_1 = __importDefault(require("../firebase/firebaseAdmin"));
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
