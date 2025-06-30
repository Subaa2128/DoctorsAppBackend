import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  userID: string;
  name: string;
  photoUrl: string;
  department: string; // or specialization
  token: string
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  userID: { type: String, required: true, unique: true },
  photoUrl: { type: String },
  department: { type: String },
  token: { type: String }

});

export default mongoose.model<IUser>('User', UserSchema);
