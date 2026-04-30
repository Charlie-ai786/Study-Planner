export interface IAchievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}
