import express from 'express';
import User from '../models/User';
import Session from '../models/Session';
import Achievement from '../models/Achievement';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    // Mock user ID for now
    const user = await User.findOne();
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      xp: user.xp,
      level: user.level,
      streak: 5,
      stats: { tasksDone: 10, pomodoros: 4 }
    });
  } catch(err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/xp', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    let user = await User.findOne();
    if (user) {
      user.xp += amount;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
      res.json({ xp: user.xp, level: user.level, reason });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json(session);
  } catch(err) {
    res.status(400).json({ message: 'Bad Request' });
  }
});

export default router;
