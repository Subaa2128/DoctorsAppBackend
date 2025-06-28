import mongoose, { Document, Schema, Model } from 'mongoose';

// Opinion sub-schema
const OpinionItemSchema = new Schema({
  Opinion: { type: String, required: true },
  Priority: { type: String, required: true }
});

const OpinionSchema = new Schema({
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
const CriticalValueItemSchema = new Schema({
  Investigation: { type: String, required: true },
  Value: { type: String, required: true }
});

const CriticalValueSchema = new Schema({
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
const AppointmentSchema = new Schema({
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

// Interface for individual notification items
export interface IOpinionItem {
  Opinion: string;
  Priority: string;
}

export interface IOpinion {
  Opinions: IOpinionItem[];
  Patient_Name: string;
  UHID: string;
  OPIP_No: string;
  Speciality: string;
  Ward: string;
  Bed_Type: string;
  Bed: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICriticalValueItem {
  Investigation: string;
  Value: string;
}

export interface ICriticalValue {
  CriticalValues: ICriticalValueItem[];
  Patient_Name: string;
  UHID: string;
  OPIP_No: string;
  Age: string;
  Ward: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment {
  Patient_Name: string;
  UHID: string;
  Age: string;
  Age_Type: string;
  Gender: string;
  App_No: string;
  App_Date: string;
  App_Time: string;
  App_Type: string;
  Patient_Type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Main notification schema
export interface INotification extends Document {
  userId: string;
  date: Date;
  Opinion: IOpinion[];
  CriticalValue: ICriticalValue[];
  Appointment: IAppointment[];
  createdAt: Date;
  updatedAt: Date;
  markNotificationAsRead(type: string, index: number): Promise<INotification>;
}

// Interface for static methods
export interface INotificationModel extends Model<INotification> {
  getNotificationsByDate(userId: string, date: Date): Promise<INotification[]>;
  markAllAsRead(userId: string, date: Date): Promise<any>;
  cleanupOldNotifications(): Promise<any>;
  markNotificationAsReadStatic(notificationId: string, type: string, index: number): Promise<any>;
  markNotificationAsReadRobust(notificationId: string, type: string, index: number): Promise<any>;
  markNotificationAsReadById(notificationId: string, type: string, itemId: string): Promise<any>;
}

const NotificationSchema: Schema = new Schema({
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
NotificationSchema.methods.markNotificationAsRead = async function(type: string, index: number) {
  if (this[type] && this[type][index]) {
    // Use updateOne with positional operator for more reliable array updates
    const result = await (this.constructor as any).updateOne(
      { _id: this._id },
      { 
        $set: {
          [`${type}.${index}.isRead`]: true,
          [`${type}.${index}.updatedAt`]: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      throw new Error(`Failed to update notification of type ${type} at index ${index}`);
    }
    
    // Update the local document to reflect changes
    this[type][index].isRead = true;
    this[type][index].updatedAt = new Date();
    
    return this;
  }
  throw new Error(`Notification of type ${type} at index ${index} not found`);
};

// Static method to get notifications for a user on a specific date
NotificationSchema.statics.getNotificationsByDate = function(userId: string, date: Date) {
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
NotificationSchema.statics.markAllAsRead = function(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.updateMany(
    {
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    },
    {
      $set: {
        'Opinion.$[].isRead': true,
        'Opinion.$[].updatedAt': new Date(),
        'CriticalValue.$[].isRead': true,
        'CriticalValue.$[].updatedAt': new Date(),
        'Appointment.$[].isRead': true,
        'Appointment.$[].updatedAt': new Date()
      }
    }
  );
};

// Static method to clean up old notifications (older than 1 day)
NotificationSchema.statics.cleanupOldNotifications = function() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  return this.deleteMany({
    createdAt: { $lt: oneDayAgo }
  });
};

// Static method to mark specific notification as read (alternative approach)
NotificationSchema.statics.markNotificationAsReadStatic = function(notificationId: string, type: string, index: number) {
  return this.updateOne(
    { _id: notificationId },
    { 
      $set: {
        [`${type}.${index}.isRead`]: true,
        [`${type}.${index}.updatedAt`]: new Date()
      }
    }
  );
};

// More robust static method using positional operator
NotificationSchema.statics.markNotificationAsReadRobust = function(notificationId: string, type: string, index: number) {
  return this.updateOne(
    { 
      _id: notificationId,
      [`${type}.${index}`]: { $exists: true }
    },
    { 
      $set: {
        [`${type}.${index}.isRead`]: true,
        [`${type}.${index}.updatedAt`]: new Date()
      }
    }
  );
};

// Static method to mark specific notification as read by _id (most reliable for subdocuments)
NotificationSchema.statics.markNotificationAsReadById = function(notificationId: string, type: string, itemId: string) {
  return this.updateOne(
    { 
      _id: notificationId,
      [`${type}._id`]: itemId
    },
    { 
      $set: {
        [`${type}.$.isRead`]: true,
        [`${type}.$.updatedAt`]: new Date()
      }
    }
  );
};

export default mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema); 