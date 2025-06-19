import mongoose, { Document, Schema } from 'mongoose';

export interface IChatRoom extends Document {
  name: string;
  members: any[]; 
  isGroup: boolean;
  createdAt: Date;
}

const ChatRoomSchema: Schema = new Schema({
  name: { type: String, required: true },
  groupCreaterId:{type:String},
  members: [{ 
    name:String,
    department:String,
    imageUrl:String,
    id:String
   }],
  isGroup: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
