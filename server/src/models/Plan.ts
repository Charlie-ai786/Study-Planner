export interface ISubject {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedHours: number;
  weakTopics?: string;
  color?: string;
}

export interface IPlan {
  id: string;
  userId: string;
  examName: string;
  examDate?: string;
  aiPlanText?: string;
  days: number;
  subjects?: string;
  slots?: string;
  routineConfig?: string;
  isActive: boolean;
  parsedDays?: string;
  isCompleted: boolean;
  createdAt?: string;
}
