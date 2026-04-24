const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

// Initialize Anthropic API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI Wellness Coach Endpoint
router.post('/coach', async (req, res) => {
  try {
    const {
      duration,
      task,
      focusScore,
      moodBefore,
      moodAfter,
      states,
      nudges,
      completed,
      notes
    } = req.body;

    const prompt = `
You are a supportive AI wellness coach embedded in Lockdin.AI, a productivity app for students. Your role is to provide a brief, personalized insight after each focus session.

Session Data:
- Duration: ${duration} mins
- Task: ${task}
- Focus Score: ${focusScore}/10
- Mood Before: ${moodBefore}/10
- Mood After: ${moodAfter}/10
- States: ${JSON.stringify(states)}
- Nudges triggered: ${nudges}
- Completed: ${completed ? 'Yes' : 'Abandoned'}
- Notes: ${notes || 'None'}

Your task:
Generate exactly 3 sentences that:
1. Acknowledge what happened in this session.
2. Insight — reveal one meaningful pattern or observation from the data.
3. Encouragement or actionable next step.

Tone guidelines:
- Warm, non-judgmental, and empathetic.
- Use "You" not "The user".
- Reference the actual task name when relevant.
- Avoid generic phrases like "Keep up the good work".
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ message: response.content[0].text });
  } catch (error) {
    console.error('Error in AI Coach:', error);
    res.status(500).json({ error: error.message || 'Failed to generate coach insight' });
  }
});

// AI Academic Planner Endpoint
router.post('/study-plan', async (req, res) => {
  try {
    const { syllabusText, currentDate, studyHoursPerDay = 2, sessionLengthMins = 25 } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: 'Syllabus text is required' });
    }

    const prompt = `
You are an AI academic planner embedded in Lockdin.AI, a productivity app for students. Your role is to transform a syllabus document into a personalized, backwards-planned study schedule.

Input Data:
Current date: ${currentDate || new Date().toISOString().split('T')[0]}
Student's available study hours per day: ${studyHoursPerDay}
Student's preferred session length: ${sessionLengthMins} mins

Syllabus Text:
${syllabusText}

Your task:
1. Extract all key information (course name, assignments, exams, topics).
2. Backwards plan from each deadline (prep 5-7 days before assignments, 10-14 days before exams).
3. Output a structured study plan in EXACTLY this JSON format (no markdown code blocks, just raw JSON). DO NOT wrap the output in \`\`\`json or any other formatting, just return the JSON object:

{
  "course_info": {
    "course_name": "",
    "course_code": "",
    "semester": "",
    "instructor": ""
  },
  "extracted_deadlines": [
    {
      "type": "assignment|exam",
      "title": "",
      "due_date": "YYYY-MM-DD",
      "weightage": "",
      "topics_covered": []
    }
  ],
  "study_schedule": [
    {
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "task_title": "Action-oriented title",
          "subject": "",
          "duration_mins": ${sessionLengthMins},
          "priority": "High|Medium|Low",
          "linked_to": "",
          "task_type": "review|practice|research",
          "notes": ""
        }
      ]
    }
  ],
  "study_tips": [
    "Tip 1",
    "Tip 2"
  ],
  "time_breakdown": {
    "total_study_hours_needed": 0,
    "hours_per_week_avg": 0,
    "peak_week": "",
    "light_week": ""
  }
}
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = response.content[0].text.trim();
    
    let scheduleData;
    try {
      // Sometimes Claude still returns markdown code blocks, so we handle that case.
      const jsonString = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
      scheduleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', responseText);
      throw new Error('AI returned an invalid response format.');
    }

    res.json(scheduleData);
  } catch (error) {
    console.error('Error in AI Planner Endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while generating the study plan',
      details: error.stack
    });
  }
});

// AI Extract Tasks Endpoint (Syllabus Scanner)
router.post('/extract-tasks', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `
You are an academic planner AI. Extract all topics, chapters, and deadlines from the syllabus text. Return a JSON array of tasks in this format: [{title, subject, deadline (YYYY-MM-DD), priority (High/Medium/Low), estimatedHours}]. If no deadline is found, estimate based on typical semester structure. Return only valid JSON.

Syllabus Text:
${text}
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = response.content[0].text.trim();
    
    let tasks;
    try {
      const jsonString = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
      tasks = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', responseText);
      // Try to extract JSON array using regex if formatting is weird
      const match = responseText.match(/\[[\s\S]*\]/);
      if (match) {
        tasks = JSON.parse(match[0]);
      } else {
        throw new Error('AI returned an invalid response format.');
      }
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error in Extract Tasks Endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred while extracting tasks',
    });
  }
});

module.exports = router;
