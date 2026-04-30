import { ISubject } from '../models/Plan';

const SYSTEM_PROMPT = `You are StudyFlow's AI academic advisor. You create highly personalized, realistic, scientifically-backed study plans for college students. You understand spaced repetition, active recall, the Pomodoro technique, and cognitive load theory. You always:
- Allocate more time to harder subjects
- Include active recall sessions (not just reading)
- Build in buffer days before the exam
- Include specific chapter/topic assignments, not just subject names
- Add motivational context to each day's plan
- Keep the last 2-3 days for full revision only
- Map the study times using EXPLICIT CLOCK TIMES (e.g. 7:00 AM - 9:00 AM) weaving around sleep and meals.
Your tone is like a supportive, sharp mentor — direct, specific, and encouraging.`;

export const streamStudyPlan = async (
  examName: string,
  examDate: string,
  subjects: ISubject[],
  syllabusText: string,
  routine: any,
  stats: any,
  res: any
) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    res.write(`data: ${JSON.stringify({ text: '⚠️ **Gemini API key not configured.**\n\nPlease add your `GEMINI_API_KEY` to `server/.env` and restart the server.\n\nGet a free key at: https://aistudio.google.com/app/apikey' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const daysUntilExam = Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const prompt = `Create an intelligent day-by-day study schedule for ${examName} occurring in ${daysUntilExam} days.
Daily constraints: Sleep: ${stats.sleepHours}h, Meals/Misc: ${stats.blockedHours}h, Net Study Time: ${stats.studyHours}h.

Routine:
- Bedtime: ${routine.sleepHour}:${String(routine.sleepMin).padStart(2,'0')} ${routine.sleepMeridian}
- Wakeup: ${routine.wakeHour}:${String(routine.wakeMin).padStart(2,'0')} ${routine.wakeMeridian}
- Breakfast: ${routine.breakfast.startH}:${String(routine.breakfast.startM).padStart(2,'0')} ${routine.breakfast.meridian}
- Preferred phase: ${routine.preference}

Subjects: 
${subjects.map((s: ISubject) => `- ${s.name} (Difficulty: ${s.difficulty})`).join('\n')}

Syllabus/Topics:
${syllabusText || 'General subject knowledge.'}

IMPORTANT: Provide the response in two parts.
Part 1: A beautiful Markdown study plan for the user to read.
Part 2: A JSON block at the very end wrapped in [TASKS_JSON]...[/TASKS_JSON] tags containing an array of tasks: 
[{"title": "Chapter 1 Review", "subject": "Math", "date": "YYYY-MM-DD", "duration": 60, "priority": "High"}]`;

  try {
    // Using native fetch for Gemini to avoid dependency issues
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}` }] }]
      })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API Error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            } catch (e) {
              // Skip partial chunks
            }
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Error:', error.message);
    res.write(`data: ${JSON.stringify({ text: `❌ Gemini Error: ${error.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

export const getSmartTip = async (subject: string): Promise<string> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return 'Try the Feynman technique: teach the concept to a 5-year-old.';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Give me one quick advanced study tip for: ${subject}` }] }]
            })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Stay focused and take regular breaks.';
    } catch {
        return 'Try the Feynman technique: teach the concept to a 5-year-old.';
    }
};
