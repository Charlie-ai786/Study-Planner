import nlp from 'compromise';
import natural from 'natural';

// Helper: strip punctuation and trim whitespace from a string
const cleanToken = (token: string): string =>
  token.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();

export const parseSyllabus = (text: string) => {
  if (!text || text.trim().length === 0) return [];

  // ── 1. Compromise NLP extraction ──────────────────────────────────────────
  const doc = nlp(text);

  // Pull nouns (most reliable) and proper nouns (usually topics)
  const nouns: string[]       = doc.nouns().out('array');
  const people: string[]      = doc.people().out('array');
  const organizations: string[] = (doc as any).organizations?.()?.out?.('array') ?? [];

  // Also tokenize with natural for word-level extraction
  const tokenizer = new natural.WordTokenizer();
  const wordTokens: string[] = tokenizer.tokenize(text) || [];

  // ── 2. Build keyword candidates ───────────────────────────────────────────
  const rawCandidates: string[] = [
    ...nouns,
    ...people,
    ...organizations,
  ]
    .map(cleanToken)
    .filter(t => t.length > 3);

  // ── 3. TF-IDF scoring over sentences ─────────────────────────────────────
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Split text into sentences for better IDF weighting
  const sentences = text
    .split(/[\n.;!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  if (sentences.length === 0) {
    tfidf.addDocument(text);
  } else {
    sentences.forEach(s => tfidf.addDocument(s));
  }

  // ── 4. Deduplicate candidates (case-insensitive) ──────────────────────────
  const seen = new Set<string>();
  const uniqueTopics: string[] = [];

  for (const candidate of rawCandidates) {
    const key = candidate.toLowerCase();
    if (!seen.has(key) && candidate.length > 3) {
      seen.add(key);
      uniqueTopics.push(candidate);
    }
  }

  // ── 5. Score each candidate using TF-IDF across all documents ─────────────
  const scoredTopics = uniqueTopics.map(topic => {
    let totalScore = 0;
    const termToScore = topic.toLowerCase();

    for (let i = 0; i < (sentences.length || 1); i++) {
      tfidf.tfidfs(termToScore, (docIndex, measure) => {
        if (docIndex === i) totalScore += measure;
      });
    }

    return {
      topic,
      score: totalScore > 0 ? totalScore : 0.1,
    };
  });

  // ── 6. Also include high-frequency single words as fallback ───────────────
  const wordFreq: Record<string, number> = {};
  const stopwords = new Set([
    'the','and','for','are','was','were','that','this','with','from','will',
    'have','has','had','not','but','they','their','than','then','when',
    'what','which','each','more','also','into','your','can','one','two',
  ]);

  wordTokens.forEach(w => {
    const lower = w.toLowerCase();
    if (w.length > 4 && !stopwords.has(lower)) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    }
  });

  // Add frequent words not already captured
  for (const [word, freq] of Object.entries(wordFreq)) {
    if (freq >= 2 && !seen.has(word)) {
      const properCased = word.charAt(0).toUpperCase() + word.slice(1);
      scoredTopics.push({ topic: properCased, score: freq * 0.5 });
      seen.add(word);
    }
  }

  // ── 7. Sort by score, return top 15 ───────────────────────────────────────
  return scoredTopics
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
};
