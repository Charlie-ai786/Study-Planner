import Anthropic from '@anthropic-ai/sdk';
import { ISubject } from '../models/Plan';

const getClient = () =>
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

const SYSTEM_PROMPT = `You are StudyFlow's AI academic advisor. You create highly personalized, realistic, scientifically-backed study plans for college students. You understand spaced repetition, active recall, the Pomodoro technique, and cognitive load theory. You always:
- Allocate more time to harder subjects
- Include active recall sessions (not just reading)
- Build in buffer days before the exam
- Include specific chapter/topic assignments, not just subject names
- Add motivational context to each day's plan
- Keep the last 2-3 days for full revision only
Your tone is like a supportive, sharp mentor — direct, specific, and encouraging.`;

export const streamStudyPlan = async (
  examName: string,
  examDate: string,
  subjects: ISubject[],
  syllabusText: string,
  routine: any,
  stats: any,
  res: any // Express Response for SSE
) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.trim() === '') {
    res.write(`data: ${JSON.stringify({ text: '⚠️ **Anthropic API key not configured.**\n\nPlease add your real `ANTHROPIC_API_KEY` to `server/.env` and restart the server.\n\nGet a free key at: https://console.anthropic.com/' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const daysUntilExam = Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const prompt = `Create an intelligent day-by-day study schedule for ${examName} occurring in ${daysUntilExam} days.
Daily constraints calculated: Sleep: ${stats.sleepHours}h, Blocked for Meals/Misc: ${stats.blockedHours}h, Net Study Time Available: ${stats.studyHours}h.

Routine Details:
- Bedtime: ${routine.sleepHour}:${String(routine.sleepMin).padStart(2,'0')} ${routine.sleepMeridian}
- Wakeup: ${routine.wakeHour}:${String(routine.wakeMin).padStart(2,'0')} ${routine.wakeMeridian}
- Breakfast starts at ${routine.breakfast.startH}:${String(routine.breakfast.startM).padStart(2,'0')} ${routine.breakfast.meridian} (${routine.breakfast.dur} min)
- Preferred deep study phase: ${routine.preference}

Subjects: 
${subjects.map((s: ISubject) => `- ${s.name} (Difficulty: ${s.difficulty})`).join('\n')}

Syllabus/Topics:
${syllabusText || 'No syllabus provided — use general subject knowledge.'}

Map the study times using EXPLICIT CLOCK TIMES (e.g. 7:00 AM - 9:00 AM) weaving around sleep and meals.
Priority: Hard subjects during ${routine.preference}. Revision block at the end of the day.
Format as beautiful, highly organized Markdown text. Make sure the output reads like a visual calendar table or list that feels extremely premium.`;

  try {
    const anthropic = getClient();
    const stream = await anthropic.messages.stream({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Anthropic API Error:', error?.message || error);

    const msg =
      error?.status === 401
        ? '❌ Invalid Anthropic API key. Please check your `server/.env` file.'
        : error?.status === 429
        ? '⏳ Rate limited by Anthropic. Please wait a moment and try again.'
        : `❌ AI generation failed: ${error?.message || 'Unknown error'}`;

    res.write(`data: ${JSON.stringify({ text: msg })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

export const getSmartTip = async (subject: string): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here' || apiKey.trim() === '') {
    return 'Try using the Feynman technique: explain the hardest concept out loud as if teaching a 5-year-old.';
  }

  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      system: 'You are a sharp, specific academic mentor. Provide one highly specific, non-obvious study tip.',
      messages: [{ role: 'user', content: `Give me one quick advanced study tip for: ${subject}` }],
    });
    return (response.content[0] as any).text ?? 'Focus on the fundamentals first, then layer in complexity.';
  } catch (error) {
    return 'Try using the Feynman technique: explain the hardest concept out loud as if teaching a 5-year-old.';
  }
};
