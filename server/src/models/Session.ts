import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  subject: string;
  durationMinutes: number;
  date: Date;
  completed: boolean;
}

const SessionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  completed: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<ISession>('Session', SessionSchema);
