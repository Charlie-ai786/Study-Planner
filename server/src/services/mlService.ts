import brain from 'brain.js';

interface TrainingData {
  input: {
    difficulty: number; // 0=easy, 0.5=medium, 1=hard
    sessionHistory: number; // normalized avg sessions historically
    daysRemaining: number; // normalized 0-1 (e.g. days/100)
    hoursAvailable: number; // normalized 0-1 (e.g. hours/24)
  };
  output: {
    recommendedHours: number; // normalized 0-1 (e.g. hours/10)
  };
}

export const predictSubjectHours = (
  difficultyLevel: 'Easy' | 'Medium' | 'Hard',
  daysRemaining: number,
  hoursAvailable: number
): number => {
  const net = new brain.NeuralNetwork();
  
  // Minimal synthetic training data to bootstrap
  const data: TrainingData[] = [
    { input: { difficulty: 0, sessionHistory: 0.2, daysRemaining: 0.3, hoursAvailable: 0.2 }, output: { recommendedHours: 0.1 } },
    { input: { difficulty: 0.5, sessionHistory: 0.5, daysRemaining: 0.1, hoursAvailable: 0.3 }, output: { recommendedHours: 0.4 } },
    { input: { difficulty: 1, sessionHistory: 0.8, daysRemaining: 0.05, hoursAvailable: 0.5 }, output: { recommendedHours: 0.8 } },
  ];
  
  net.train(data, { iterations: 2000 });
  
  const diffMap = { 'Easy': 0, 'Medium': 0.5, 'Hard': 1 };
  
  const result = net.run({
    difficulty: diffMap[difficultyLevel],
    sessionHistory: 0.5, // placeholder
    daysRemaining: Math.min(daysRemaining / 100, 1),
    hoursAvailable: Math.min(hoursAvailable / 24, 1)
  }) as { recommendedHours: number };
  
  // Denormalize (assume max 10 hours per subject theoretically)
  return Math.max(1, Math.round(result.recommendedHours * 10));
};
