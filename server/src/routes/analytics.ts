import express from 'express';

const router = express.Router();

router.get('/heatmap', async (req, res) => {
  try {
    // Return mock heatmap data
    const data = Array.from({ length: 28 }).map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      count: Math.floor(Math.random() * 5)
    }));
    res.json(data);
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    res.json([
      { subject: 'Physics', hours: 45 },
      { subject: 'Math', hours: 30 },
      { subject: 'History', hours: 15 }
    ]);
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    res.json([
      { date: '2023-10-01', hours: 2 },
      { date: '2023-10-02', hours: 4 }
    ]);
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/prediction', async (req, res) => {
  try {
    res.json({
      predictedDaysLeft: 38,
      message: 'On track to finish 4 days early!'
    });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
