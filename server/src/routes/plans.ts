import express from 'express';
import { protect } from '../middleware/auth';
import db from '../config/database';
import crypto from 'crypto';

const router = express.Router();

router.use(protect);

router.get('/', (req: any, res) => {
  try {
    const plans = db.prepare('SELECT * FROM plans WHERE userId = ?').all(req.user.userId);
    res.json(plans.map((p: any) => ({ ...p, _id: p.id })));
  } catch(err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', (req: any, res) => {
  try {
    const id = crypto.randomUUID();
    const { examName, examDate, aiPlanText } = req.body;

    db.prepare(`
      INSERT INTO plans (id, userId, examName, examDate, aiPlanText)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.userId, examName, examDate, aiPlanText);

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
    res.status(201).json({ ...plan as object, _id: id });
  } catch(err) {
    res.status(400).json({ message: 'Bad Request' });
  }
});

router.get('/:id', (req: any, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND userId = ?').get(req.params.id, req.user.userId);
    if (!plan) return res.status(404).json({ message: 'Not Found' });
    res.json({ ...plan as object, _id: (plan as any).id });
  } catch(err) {
    res.status(404).json({ message: 'Not Found' });
  }
});

router.delete('/:id', (req: any, res) => {
  try {
    const result = db.prepare('DELETE FROM plans WHERE id = ? AND userId = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ message: 'Not Found' });
    res.json({ message: 'Deleted' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
