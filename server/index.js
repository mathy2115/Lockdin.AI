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
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    });
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
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected Route Example
const auth = require('./middleware/auth');
app.get('/api/auth/user', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user } });
  res.json(user);
});

const PORT = process.env.PORT || 5000;
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
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
