import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

function parsePlanIntoDays(planText: string) {
  const days = [];
  const lines = planText.split('\n');
  let currentDay: any = null;
  for (const line of lines) {
    const dayMatch = line.match(/^Day\s+(\d+)\s*\|?\s*Phase?:?\s*(.+)?/i);
    if (dayMatch) {
      if (currentDay) days.push(currentDay);
      currentDay = { day: parseInt(dayMatch[1]), phase: dayMatch[2]?.trim() || 'Study', sessions: [] };
    } else if (currentDay && line.trim().startsWith('-')) {
      currentDay.sessions.push(line.trim().replace(/^-\s*/, ''));
    }
  }
  if (currentDay) days.push(currentDay);
  return days;
}

function mapPlan(plan: any) {
  if (!plan) return null;
  return {
    id: plan.id,
    userId: plan.user_id,
    planText: plan.plan_text,
    examName: plan.exam_name,
    days: plan.days,
    subjects: JSON.parse(plan.subjects || '[]'),
    slots: JSON.parse(plan.slots || '[]'),
    routineConfig: JSON.parse(plan.routine_config || '{}'),
    parsedDays: JSON.parse(plan.parsed_days || '[]'),
    isActive: !!plan.is_active,
    createdAt: plan.created_at
  };
}

// SAVE PLAN
router.post('/save', authenticateToken, (req: any, res) => {
  try {
    const { planText, examName, days, subjects, slots, routineConfig } = req.body;

    if (!planText || !examName || !days) {
      return res.status(400).json({ success: false, message: 'planText, examName, days are required' });
    }

    const userId = req.user.id;
    const parsedDays = parsePlanIntoDays(planText);

    // Deactivate all old plans
    db.prepare('UPDATE plans SET is_active = 0 WHERE user_id = ?').run(userId);

    // Insert new plan
    const result = db.prepare(`
      INSERT INTO plans (user_id, plan_text, exam_name, days, subjects, slots, routine_config, parsed_days, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      userId,
      planText,
      examName,
      Number(days),
      JSON.stringify(subjects || []),
      JSON.stringify(slots || []),
      JSON.stringify(routineConfig || {}),
      JSON.stringify(parsedDays)
    );

    // Update user active plan
    db.prepare('UPDATE users SET active_plan_id = ?, exam_name = ?, exam_days = ? WHERE id = ?')
      .run(result.lastInsertRowid, examName, Number(days), userId);

    // Fetch and return saved plan
    const saved = db.prepare('SELECT * FROM plans WHERE id = ?').get(result.lastInsertRowid) as any;
    
    return res.status(200).json({ success: true, plan: mapPlan(saved) });
  } catch (err: any) {
    console.error('Save plan error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET ACTIVE PLAN
router.get('/active', authenticateToken, (req: any, res) => {
  try {
    const plan = db.prepare(
      'SELECT * FROM plans WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(req.user.id) as any;

    if (!plan) {
      return res.status(404).json({ success: false, message: 'No active plan found' });
    }

    return res.status(200).json({ success: true, plan: mapPlan(plan) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET ALL PLANS
router.get('/', authenticateToken, (req: any, res) => {
  try {
    const plans = db.prepare(
      'SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id) as any[];

    return res.status(200).json({ success: true, plans: plans.map(mapPlan) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE PLAN
router.delete('/:id', authenticateToken, (req: any, res) => {
  try {
    db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
