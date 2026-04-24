require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// AI Routes
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// Tasks Routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// Auth middleware
const auth = require('./middleware/auth');

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: newUser.id, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get('/api/auth/user', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user } });
  res.json(user);
});

// Gemini Syllabus Scanner
app.post('/api/scan-syllabus', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract all tasks, assignments, topics and deadlines from this syllabus. Return ONLY a valid JSON array, no explanation, no markdown, no backticks. Format: [{"title": "...", "subject": "...", "deadline": "YYYY-MM-DD", "priority": "High" or "Medium" or "Low", "estimatedHours": number}]. If no deadline found, use null. Syllabus text: ${text.slice(0, 8000)}`
            }]
          }],
          generationConfig: { temperature: 0.2 }
        })
      }
    );
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const tasks = JSON.parse(cleaned);
    res.json(tasks);
  } catch (error) {
    console.error('Gemini syllabus error:', error);
    res.status(500).json({ error: 'Failed to scan syllabus' });
  }
});

// Save mood log
app.post('/api/mood', auth, async (req, res) => {
  try {
    const { mood, energy, stress, note } = req.body;
    const moodLog = await prisma.moodLog.create({
      data: {
        userId: req.user,
        mood: parseInt(mood),
        energy: parseInt(energy),
        stress: parseInt(stress),
        note: note || '',
      },
    });
    res.json(moodLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get last 7 days of mood logs
app.get('/api/mood/week', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const logs = await prisma.moodLog.findMany({
      where: {
        userId: req.user,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));