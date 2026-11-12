import { Router } from 'express';
import mongoose from 'mongoose';

import { Todo } from '../models/todo.js';

export const todosRouter = Router();

todosRouter.get('/', async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json({ todos });
});

todosRouter.post('/', async (req, res) => {
  const { item } = req.body ?? {};

  if (typeof item !== 'string' || item.trim() === '') {
    return res.status(400).json({ error: '`item` is required.' });
  }

  const todo = await Todo.create({ item });
  res.status(201).json({ todo });
});

todosRouter.patch('/:id', async (req, res) => {
  const { completed } = req.body ?? {};

  if (typeof completed !== 'boolean') {
    return res
      .status(400)
      .json({ error: '`completed` must be a boolean value.' });
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid todo id.' });
  }

  const todo = await Todo.findByIdAndUpdate(
    req.params.id,
    { completed },
    { returnDocument: 'after', runValidators: true },
  );

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  res.json({ todo });
});

todosRouter.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid todo id.' });
  }

  const todo = await Todo.findByIdAndDelete(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found.' });
  }

  res.status(204).end();
});
