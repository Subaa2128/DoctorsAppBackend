import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia {
  type: 'image' | 'voice' | 'file' | 'document' | 'video';
  url: string;                // HTTPS link (e.g., Firebase)
  fileName?: string;          // Original filename
  mimeType?: string;          // MIME type (e.g., audio/mp3)
  size?: number;              // Size in bytes
  duration?: number;          // Duration in seconds
}

export interface IReadStatus {
  userID: string;
  readAt: Date;
}

export interface IMessage extends Document {
  senderID: string;
  recipientID?: string;       // For 1-to-1 chat
  roomID?: mongoose.Types.ObjectId;  // For group chat
  text?: string;              // Optional caption
  timestamp: Date;
  media?: IMedia[];           // Support multiple attachments
  readBy: IReadStatus[];      // Array of users who have read this message
}

const MediaSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['image', 'voice', 'file', 'document', 'video'],
      required: true,
    },
    url: { type: String, required: true },
    fileName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    duration: { type: Number },
  },
  { _id: false } // No separate _id for each media object
);

const ReadStatusSchema: Schema = new Schema(
  {
    userID: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema: Schema = new Schema({
  senderID: { type: String, required: true },
  recipientID: { type: String },
  roomID: { type: Schema.Types.ObjectId, ref: 'ChatRoom' },
  text: { type: String },
  timestamp: { type: Date, default: Date.now },
  media: [MediaSchema],
  readBy: [ReadStatusSchema],
});

export default mongoose.model<IMessage>('Message', MessageSchema);
