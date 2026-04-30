import express from 'express';
import { protect } from '../middleware/auth';
import db from '../config/database';
import crypto from 'crypto';

const router = express.Router();

router.use(protect);

router.get('/sessions', (req: any, res) => {
  try {
    const sessions = db.prepare('SELECT * FROM sessions WHERE userId = ? ORDER BY date DESC').all(req.user.userId);
    res.json(sessions.map((s: any) => ({ ...s, _id: s.id })));
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/sessions', (req: any, res) => {
  try {
    const id = crypto.randomUUID();
    const { subject, duration, date } = req.body;

    db.prepare(`
      INSERT INTO sessions (id, userId, subject, duration, date)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.userId, subject, duration, date || new Date().toISOString().split('T')[0]);

    // Update User XP
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(Math.floor(duration / 10), req.user.userId);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    res.status(201).json({ ...session as object, _id: id });
  } catch(err) {
    res.status(400).json({ message: 'Error' });
  }
});

export default router;
