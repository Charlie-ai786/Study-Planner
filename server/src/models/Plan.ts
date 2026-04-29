import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedHours: number;
  weakTopics?: string;
  color?: string; // used for timetable
}

export interface IPlan extends Document {
  user: mongoose.Types.ObjectId;
  examName: string;
  examDate: Date;
  school?: string;
  examType: string;
  subjects: ISubject[];
  syllabusText: string;
  dailyPlans: {
    date: Date;
    tasks: {
      subject: string;
      topic: string;
      duration: number; // expected minutes
      type: 'Reading' | 'Active Recall' | 'Practice' | 'Revision';
      notes?: string;
    }[];
  }[];
  isActive: boolean;
}

const SubjectSchema = new Schema({
  name: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  estimatedHours: { type: Number, required: true },
  weakTopics: { type: String },
  color: { type: String },
});

const PlanSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  examName: { type: String, required: true },
  examDate: { type: Date, required: true },
  school: { type: String },
  examType: { type: String, required: true },
  subjects: [SubjectSchema],
  syllabusText: { type: String },
  dailyPlans: [{
    date: { type: Date },
    tasks: [{
      subject: { type: String },
      topic: { type: String },
      duration: { type: Number },
      type: { type: String, enum: ['Reading', 'Active Recall', 'Practice', 'Revision'] },
      notes: { type: String }
    }]
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IPlan>('Plan', PlanSchema);
