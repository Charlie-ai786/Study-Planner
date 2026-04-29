import nlp from 'compromise';
import natural from 'natural';

export const parseSyllabus = (text: string) => {
  // Use compromise to extract nouns and potential topics
  const doc = nlp(text);
  const nouns = doc.nouns().out('array');
  const topics = doc.topics().out('array');
  
  // Basic TF-IDF or frequency count to rank
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  tfidf.addDocument(text);
  
  // We'll combine and deduplicate
  const rawExtract = [...topics, ...nouns].filter(t => t.length > 3);
  const uniqueTopics = [...new Set(rawExtract)];
  
  const scoredTopics = uniqueTopics.map(topic => {
    let score = 0;
    tfidf.tfidfs(topic, (i, measure) => {
      score += measure;
    });
    return {
      topic,
      score: score || 0.1
    };
  });
  
  // Sort by score
  return scoredTopics.sort((a, b) => b.score - a.score).slice(0, 15);
};
