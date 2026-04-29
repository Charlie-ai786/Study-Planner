import Anthropic from '@anthropic-ai/sdk';
import { ISubject } from '../models/Plan';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
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
  const daysUntilExam = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const prompt = `Create an intelligent day-by-day study schedule for ${examName} occurring in ${daysUntilExam} days.
Daily constraints calculated: Sleep: ${stats.sleepHours}h, Blocked for Meals/Misc: ${stats.blockedHours}h, Net Study Time Available: ${stats.studyHours}h.

Routine Details:
- Bedtime: ${routine.sleepHour}:${routine.sleepMin} ${routine.sleepMeridian}
- Wakeup: ${routine.wakeHour}:${routine.wakeMin} ${routine.wakeMeridian}
- Breakfast starts at ${routine.breakfast.startH}:${routine.breakfast.startM} ${routine.breakfast.meridian} (${routine.breakfast.dur} min)
- Preferred deep study phase: ${routine.preference}

Subjects: 
${subjects.map(s => `- ${s.name} (Difficulty: ${s.difficulty})`).join('\n')}

Syllabus/Topics:
${syllabusText}

Map the study times using EXPLICIT CLOCK TIMES (e.g. 7:00 AM - 9:00 AM) weaving around sleep and meals.
Priority: Hard subjects during ${routine.preference}. Revision block at the end of the day.
Format as beautiful, highly organized Markdown text. Make sure the output reads like a visual calendar table or list that feels extremely premium.`;

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Anthropic API Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate plan' })}\n\n`);
    res.end();
  }
};

export const getSmartTip = async (subject: string): Promise<string> => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      system: "You are a sharp, specific academic mentor. Provide one highly specific, non-obvious study tip.",
      messages: [{ role: 'user', content: `Give me one quick advanced study tip for: ${subject}` }]
    });
    // @ts-ignore
    return response.content[0].text;
  } catch (error) {
    return 'Try using the Feynman technique: explain the hardest concept out loud as if teaching a 5-year-old.';
  }
};
