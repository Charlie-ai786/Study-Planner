import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievementId: string; // e.g., 'first_step', 'scholar'
  unlockedAt: Date;
}

const AchievementSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure a user can only unlock an achievement once
AchievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
