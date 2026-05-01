import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET achievements
router.get('/achievements', authenticateToken, (req: any, res) => {
  try {
    const achievements = db.prepare(
      'SELECT achievement_id as id, unlocked_at FROM achievements WHERE user_id = ?'
    ).all(req.user.id);
    
    // Map to what frontend expects (e.g. icon, title)
    // For now returning the IDs
    res.json(achievements);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET user stats
router.get('/user-stats', authenticateToken, (req: any, res) => {
  try {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(req.user.id) as any;
    if (!progress) return res.status(404).json({ message: 'Stats not found' });
    
    res.json({
      xp: progress.xp,
      level: Math.floor(progress.xp / 100) + 1,
      streak: progress.streak,
      longestStreak: progress.longest_streak,
      totalTasks: progress.total_tasks,
      totalSessions: progress.total_sessions
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET full progress summary
router.get('/summary', authenticateToken, (req: any, res) => {
  try {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(req.user.id) as any;
    if (!progress) return res.status(404).json({ success: false, message: 'No progress found' });

    const achievements = db.prepare(
      'SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC'
    ).all(req.user.id);

    return res.status(200).json({ 
      success: true, 
      progress: {
        ...progress,
        level: Math.floor(progress.xp / 100) + 1,
        xpToNextLevel: 100 - (progress.xp % 100),
        achievements
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ADD XP manually (Pomodoro session etc)
router.post('/xp', authenticateToken, (req: any, res) => {
  try {
    const { amount, reason } = req.body;
    const xp = Math.abs(Number(amount)) || 10;

    db.prepare('UPDATE progress SET xp = xp + ? WHERE user_id = ?').run(xp, req.user.id);

    if (reason === 'pomodoro') {
      db.prepare('UPDATE progress SET total_sessions = total_sessions + 1 WHERE user_id = ?')
        .run(req.user.id);
    }

    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(req.user.id) as any;
    return res.status(200).json({ success: true, xp: progress.xp, amount: xp });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
