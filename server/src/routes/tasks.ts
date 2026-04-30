import express from 'express';
import { protect } from '../middleware/auth';
import db from '../config/database';
import crypto from 'crypto';

const router = express.Router();

router.use(protect);

router.get('/', (req: any, res) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM tasks WHERE userId = ?';
    const params: any[] = [req.user.userId];

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    
    const tasks = db.prepare(sql).all(...params); 
    res.json(tasks.map((t: any) => ({ ...t, _id: t.id })));
  } catch(err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', (req: any, res) => {
  try {
    const id = crypto.randomUUID();
    const { title, subject, duration, date, priority } = req.body;

    db.prepare(`
      INSERT INTO tasks (id, userId, title, subject, duration, date, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.userId, title, subject, duration || 30, date, priority || 'Medium');

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json({ ...task as object, _id: id });
  } catch(err) {
    res.status(400).json({ message: 'Bad Request' });
  }
});

router.patch('/:id', (req: any, res) => {
  try {
    const { title, subject, duration, isCompleted, date, priority } = req.body;
    
    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (subject !== undefined) { updates.push('subject = ?'); params.push(subject); }
    if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
    if (isCompleted !== undefined) { updates.push('isCompleted = ?'); params.push(isCompleted ? 1 : 0); }
    if (date !== undefined) { updates.push('date = ?'); params.push(date); }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }

    if (updates.length === 0) return res.json({ message: 'No changes' });

    params.push(req.params.id, req.user.userId);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND userId = ?`).run(...params);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json({ ...task as object, _id: req.params.id });
  } catch(err) {
    res.status(400).json({ message: 'Error' });
  }
});

router.delete('/:id', (req: any, res) => {
  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND userId = ?').run(req.params.id, req.user.userId);
    if (result.changes === 0) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Deleted' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/bulk-complete', (req: any, res) => {
  try {
    const { ids } = req.body;
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE tasks SET isCompleted = 1 WHERE id IN (${placeholders}) AND userId = ?`).run(...ids, req.user.userId);
    res.json({ message: 'Bulk Updated' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
