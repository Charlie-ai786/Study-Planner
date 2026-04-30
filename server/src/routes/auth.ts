import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../config/database';

const router = express.Router();

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, goal } = req.body;

    // Check if user exists
    const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, name, email, password, goal)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, email, hashedPassword, goal);

    const token = generateToken(userId);

    res.json({
      _id: userId,
      name,
      email,
      level: 1,
      xp: 0,
      token,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user.id);
      
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
