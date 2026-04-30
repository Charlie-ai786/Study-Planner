import express from 'express';
import { protect } from '../middleware/auth';
import { streamStudyPlan, getSmartTip } from '../services/geminiService';
import { parseSyllabus } from '../services/nlpService';

const router = express.Router();

router.use(protect);

router.post('/generate-plan', async (req, res) => {
  const { examName, examDate, subjects, syllabusText, routine, stats } = req.body;
  
  // Require header for standard SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  await streamStudyPlan(examName, examDate, subjects, syllabusText, routine, stats, res);
});

router.post('/parse-syllabus', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'No text provided' });
  
  const topics = parseSyllabus(text);
  res.json({ topics });
});

router.post('/smart-tip', async (req, res) => {
  const { subject } = req.body;
  const tip = await getSmartTip(subject || 'General Study');
  res.json({ tip });
});

export default router;
