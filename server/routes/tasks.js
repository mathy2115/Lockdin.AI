const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user },
      orderBy: { deadline: 'asc' }, // Nearest deadline first
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, subject, deadline, priority, estimatedHours } = req.body;
    
    // Parse deadline
    const deadlineDate = deadline ? new Date(deadline) : null;

    const task = await prisma.task.create({
      data: {
        title,
        subject,
        deadline: deadlineDate,
        priority: priority || 'Medium',
        status: 'todo',
        estimatedHours: estimatedHours ? parseInt(estimatedHours, 10) : null,
        userId: req.user,
      },
    });
    
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status (for drag and drop)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, deadline, title, subject, estimatedHours } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseInt(estimatedHours, 10) : null;

    const task = await prisma.task.update({
      where: { 
        id: parseInt(id),
        userId: req.user, // ensure ownership
      },
      data: updateData,
    });
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.task.delete({
      where: { 
        id: parseInt(id),
        userId: req.user,
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Bulk create tasks (for Syllabus Scanner)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be an array' });
    }

    const createdTasks = await Promise.all(
      tasks.map(t => 
        prisma.task.create({
          data: {
            title: t.title,
            subject: t.subject || 'General',
            deadline: t.deadline ? new Date(t.deadline) : null,
            priority: t.priority || 'Medium',
            status: 'todo',
            estimatedHours: t.estimatedHours ? parseInt(t.estimatedHours, 10) : null,
            userId: req.user,
          }
        })
      )
    );

    res.json(createdTasks);
  } catch (error) {
    console.error('Error bulk creating tasks:', error);
    res.status(500).json({ error: 'Failed to save scanned tasks' });
  }
});

module.exports = router;
