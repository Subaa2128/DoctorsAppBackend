"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Opinion sub-schema
const OpinionItemSchema = new mongoose_1.Schema({
    Opinion: { type: String, required: true },
    Priority: { type: String, required: true }
});
const OpinionSchema = new mongoose_1.Schema({
    Opinions: [OpinionItemSchema],
    Patient_Name: { type: String, required: true },
    UHID: { type: String, required: true },
    OPIP_No: { type: String, required: true },
    Speciality: { type: String, required: true },
    Ward: { type: String, required: true },
    Bed_Type: { type: String, required: true },
    Bed: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Critical Value sub-schema
const CriticalValueItemSchema = new mongoose_1.Schema({
    Investigation: { type: String, required: true },
    Value: { type: String, required: true }
});
const CriticalValueSchema = new mongoose_1.Schema({
    CriticalValues: [CriticalValueItemSchema],
    Patient_Name: { type: String, required: true },
    UHID: { type: String, required: true },
    OPIP_No: { type: String, required: true },
    Age: { type: String, required: true },
    Ward: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Appointment sub-schema
const AppointmentSchema = new mongoose_1.Schema({
    Patient_Name: { type: String, required: true },
    UHID: { type: String, required: true },
    Age: { type: String, required: true },
    Age_Type: { type: String, required: true },
    Gender: { type: String, required: true },
    App_No: { type: String, required: true },
    App_Date: { type: String, required: true },
    App_Time: { type: String, required: true },
    App_Type: { type: String, required: true },
    Patient_Type: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    Opinion: [OpinionSchema],
    CriticalValue: [CriticalValueSchema],
    Appointment: [AppointmentSchema]
}, {
    timestamps: true
});
// Compound index for efficient queries
NotificationSchema.index({ userId: 1, date: 1 });
// TTL index to automatically delete notifications older than 1 day
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
// Method to mark specific notification as read
NotificationSchema.methods.markNotificationAsRead = function (type, index) {
    if (this[type] && this[type][index]) {
        this[type][index].isRead = true;
        this[type][index].updatedAt = new Date();
        return this.save();
    }
    throw new Error(`Notification of type ${type} at index ${index} not found`);
};
// Static method to get notifications for a user on a specific date
NotificationSchema.statics.getNotificationsByDate = function (userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return this.find({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
};
// Static method to mark all notifications as read for a user on a specific date
NotificationSchema.statics.markAllAsRead = function (userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return this.updateMany({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }, {
        $set: {
            'Opinion.$[].isRead': true,
            'Opinion.$[].updatedAt': new Date(),
            'CriticalValue.$[].isRead': true,
            'CriticalValue.$[].updatedAt': new Date(),
            'Appointment.$[].isRead': true,
            'Appointment.$[].updatedAt': new Date()
        }
    });
};
// Static method to clean up old notifications (older than 1 day)
NotificationSchema.statics.cleanupOldNotifications = function () {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.deleteMany({
        createdAt: { $lt: oneDayAgo }
    });
};
exports.default = mongoose_1.default.model('Notification', NotificationSchema);
