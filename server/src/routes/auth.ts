import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';

const router = express.Router();

function mapUser(user: any, progress: any = null) {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university,
    level: progress ? Math.floor(progress.xp / 100) + 1 : (user.level || 1),
    xp: progress ? progress.xp : (user.xp || 0),
    examName: user.exam_name,
    examDays: user.exam_days
  };
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, university } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }

    // Check email exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, email, password, university) VALUES (?, ?, ?, ?)'
    ).run(name, email, hashed, university || '');

    const userId = result.lastInsertRowid;

    // Create progress row for new user
    db.prepare(
      'INSERT INTO progress (user_id) VALUES (?)'
    ).run(userId);

    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId);
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    return res.status(201).json({ 
      success: true, 
      token,
      user: mapUser({ id: userId, name, email, university }, progress)
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(user.id);
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: mapUser(user, progress)
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
