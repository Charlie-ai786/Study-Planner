import express from 'express';
import { authenticateToken } from '../middleware/auth';
import db from '../db';

const router = express.Router();

router.use(authenticateToken);

// Matches Frontend: fetch(`${API_URL}/analytics/subjects`)
router.get('/subjects', (req: any, res) => {
  try {
    const data = db.prepare(`
      SELECT subject as subject, SUM(duration) / 60.0 as hours 
      FROM sessions 
      WHERE user_id = ? 
      GROUP BY subject
    `).all(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Matches Frontend: fetch(`${API_URL}/analytics/heatmap`)
router.get('/heatmap', (req: any, res) => {
  try {
    const data = db.prepare(`
      SELECT date as date, SUM(duration) / 60.0 as count 
      FROM sessions 
      WHERE user_id = ? 
      GROUP BY date
      ORDER BY date ASC
      LIMIT 14
    `).all(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching heatmap' });
  }
});

export default router;
