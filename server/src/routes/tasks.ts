import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

function mapTask(task: any) {
  if (!task) return null;
  return {
    id: task.id,
    _id: task.id,
    userId: task.user_id,
    text: task.text,
    title: task.title || task.text,
    subject: task.subject,
    duration: task.duration,
    priority: task.priority,
    isCompleted: !!(task.is_completed || task.done),
    xpAwarded: task.xp_awarded,
    date: task.date,
    createdAt: task.created_at
  };
}

// GET tasks (today by default)
router.get('/', authenticateToken, (req: any, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const tasks = db.prepare(
      'SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY created_at DESC'
    ).all(req.user.id, date);
    return res.status(200).json({ success: true, tasks: tasks.map(mapTask) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE task
router.post('/', authenticateToken, (req: any, res) => {
  try {
    const { text, title, subject, priority, duration } = req.body;
    if (!text && !title) return res.status(400).json({ success: false, message: 'Task text or title required' });

    const result = db.prepare(
      'INSERT INTO tasks (user_id, text, title, subject, priority, duration) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, text || title, title || text, subject || '', priority || 'medium', duration || 30);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, task: mapTask(task) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE task (supports completion)
router.patch('/:id', authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { isCompleted } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId) as any;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (isCompleted && !(task.is_completed || task.done)) {
      // Mark done and award XP
      db.prepare('UPDATE tasks SET done = 1, is_completed = 1, xp_awarded = 20 WHERE id = ?').run(taskId);

      // Award XP — update progress table
      db.prepare(`
        UPDATE progress 
        SET xp = xp + 20, total_tasks = total_tasks + 1
        WHERE user_id = ?
      `).run(userId);

      // Update streak
      updateStreak(userId);

      // Check achievements
      const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId) as any;
      checkAndUnlockAchievements(userId, progress);

      return res.status(200).json({ success: true, xpAwarded: 20, progress: { ...progress, level: Math.floor(progress.xp / 100) + 1 } });
    } else {
      // Just update other fields if needed, or just return success
      return res.status(200).json({ success: true, xpAwarded: 0 });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE task
router.delete('/:id', authenticateToken, (req: any, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

function updateStreak(userId: number) {
  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId) as any;
  const today = new Date().toISOString().split('T')[0];
  const last = progress.last_active;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  let newStreak = progress.streak;
  if (last === today) return; // already updated today
  if (last === yStr) newStreak += 1; // continued streak
  else newStreak = 1; // reset streak

  const longest = Math.max(newStreak, progress.longest_streak);

  db.prepare(`
    UPDATE progress 
    SET streak = ?, longest_streak = ?, last_active = ?
    WHERE user_id = ?
  `).run(newStreak, longest, today, userId);
}

function checkAndUnlockAchievements(userId: number, progress: any) {
  const rules = [
    { id: 'first_step',    check: () => progress.total_tasks >= 1 },
    { id: 'century',       check: () => progress.xp >= 100 },
    { id: 'iron_will',     check: () => progress.total_tasks >= 50 },
    { id: 'on_fire',       check: () => progress.streak >= 3 },
    { id: 'week_warrior',  check: () => progress.streak >= 7 },
    { id: 'marathon',      check: () => progress.streak >= 14 },
    { id: 'pomodoro_pro',  check: () => progress.total_sessions >= 10 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)
  `);

  for (const rule of rules) {
    if (rule.check()) insert.run(userId, rule.id);
  }
}

export default router;
