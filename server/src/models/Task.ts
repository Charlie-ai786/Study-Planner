import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  plan?: mongoose.Types.ObjectId;
  date: Date;
  subject: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  xpAwarded: boolean;
}

const TaskSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: Schema.Types.ObjectId, ref: 'Plan' },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isCompleted: { type: Boolean, default: false },
  xpAwarded: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
