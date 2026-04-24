const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ message: responseText });
  } catch (error) {
    console.error('Error in AI Coach:', error);
    res.status(500).json({ error: 'Failed to generate coach insight' });
  }
});

// AI Academic Planner Endpoint
router.post('/planner', async (req, res) => {
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
3. Output a structured study plan in EXACTLY this JSON format (no markdown code blocks, just raw JSON):

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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON to ensure it's valid before sending
    const scheduleData = JSON.parse(responseText);

    res.json(scheduleData);
  } catch (error) {
    console.error('Error in AI Planner:', error);
    res.status(500).json({ error: 'Failed to generate study schedule' });
  }
});

module.exports = router;
