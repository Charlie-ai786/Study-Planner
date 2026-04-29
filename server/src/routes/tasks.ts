import express from 'express';
import Task from '../models/Task';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const date = req.query.date;
    const tasks = await Task.find(); 
    res.json(tasks);
  } catch(err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch(err) {
    res.status(400).json({ message: 'Bad Request' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch(err) {
    res.status(400).json({ message: 'Error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post('/bulk-complete', async (req, res) => {
  try {
    const { ids } = req.body;
    await Task.updateMany({ _id: { $in: ids } }, { completed: true });
    res.json({ message: 'Bulk Updated' });
  } catch(err) {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;
