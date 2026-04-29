import express from 'express';
// import { protect } from '../middleware/auth';
import Plan from '../models/Plan';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find(); // would be filtered by user in prod
    res.json(plans);
  } catch(err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch(err) {
    res.status(400).json({ message: 'Bad Request' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    res.json(plan);
  } catch(err) {
    res.status(404).json({ message: 'Not Found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
