export interface ITask {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  duration: number;
  isCompleted: boolean;
  date: string;
  priority: 'Low' | 'Medium' | 'High';
}
