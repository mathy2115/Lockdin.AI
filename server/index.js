require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const { Resend } = require('resend');

const app = express();
const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);
const resetTokens = new Map();

// Test connection
sql`SELECT 1`.then(() => {
  console.log('Database connected successfully via Neon HTTP');
}).catch(err => {
  console.error('Database connection failed:', err.message);
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Auth middleware
const auth = require('./middleware/auth');

// AI Routes
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// Tasks Routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const existing = await sql`SELECT id FROM "User" WHERE LOWER(email) = LOWER(${email})`;
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userName = name || email.split('@')[0];

    const result = await sql`
      INSERT INTO "User" (email, password, name, "createdAt")
      VALUES (${email.toLowerCase()}, ${hashedPassword}, ${userName}, NOW())
      RETURNING id, email, name
    `;

    const newUser = result[0];
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const result = await sql`SELECT * FROM "User" WHERE LOWER(email) = LOWER(${email})`;

    if (result.length === 0) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Incorrect password');
      return res.status(401).json({ message: 'Incorrect password' });
    }

    console.log('Login successful');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await sql`SELECT id, email, name FROM "User" WHERE LOWER(email) = LOWER(${email})`;
    
    // Always return success message to prevent email enumeration
    const successMsg = 'If that email exists, a reset link has been sent.';

    if (result.length > 0) {
      const user = result[0];
      const token = crypto.randomBytes(32).toString('hex');
      
      resetTokens.set(token, {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 3600000 // 1 hour expiry
      });

      const resetLink = `http://localhost:5173/reset-password?token=${token}`;
      
      await resend.emails.send({
        from: 'Lockdin.AI <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your Lockdin.AI password',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1A1A2E;">
            <h2>Password Reset</h2>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
    }

    res.json({ message: successMsg });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const tokenData = resetTokens.get(token);
    
    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await sql`UPDATE "User" SET password = ${hashedPassword} WHERE id = ${tokenData.userId}`;
    
    resetTokens.delete(token);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get current user
app.get('/api/auth/user', auth, async (req, res) => {
  try {
    const result = await sql`SELECT id, email, name FROM "User" WHERE id = ${req.user}`;
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save mood log
app.post('/api/mood', auth, async (req, res) => {
  try {
    const { mood, energy, stress, note } = req.body;
    const result = await sql`
      INSERT INTO "MoodLog" ("userId", mood, energy, stress, note, date, "createdAt")
      VALUES (${req.user}, ${parseInt(mood)}, ${parseInt(energy)}, ${parseInt(stress)}, ${note || ''}, NOW(), NOW())
      RETURNING *
    `;
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get last 7 days of mood logs
app.get('/api/mood/week', auth, async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM "MoodLog"
      WHERE "userId" = ${req.user}
      AND date >= NOW() - INTERVAL '7 days'
      ORDER BY date ASC
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
          contents: [{ parts: [{ text: `Extract all tasks, assignments, topics and deadlines from this syllabus. Return ONLY a valid JSON array, no explanation, no markdown, no backticks. Format: [{"title": "...", "subject": "...", "deadline": "YYYY-MM-DD", "priority": "High" or "Medium" or "Low", "estimatedHours": number}]. If no deadline found, use null. Syllabus text: ${text.slice(0, 8000)}` }] }],
          generationConfig: { temperature: 0.2 }
        })
      }
    );
    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Gemini syllabus error:', error);
    res.status(500).json({ error: 'Failed to scan syllabus' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));