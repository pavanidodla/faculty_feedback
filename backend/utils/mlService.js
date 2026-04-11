const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const INVALID_PHRASES = [
  'good','excellent','no improvements','i love you','great','perfect',
  'nothing','no issues','all good','nice','ok','okay','fine','no problem',
  'superb','amazing','wonderful','best','awesome','no need','nothing to improve',
  'very good','well done','keep it up','satisfied','no feedback','nil','none',
  'na','n/a','no changes','no complaints','everything is good','no suggestion',
];

const fallbackValidate = (text) => {
  if (!text || text.trim().length < 10)
    return { is_valid: false, reason: 'Too short. Minimum 10 characters required.' };
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  if (words.length < 3)
    return { is_valid: false, reason: 'Too few words. Please provide a meaningful suggestion.' };
  for (const phrase of INVALID_PHRASES)
    if (lower === phrase)
      return { is_valid: false, reason: `"${text}" is too generic. Please be specific.` };
  const uniqueRatio = new Set(words).size / words.length;
  if (uniqueRatio < 0.4 && words.length > 3)
    return { is_valid: false, reason: 'Response appears repetitive.' };
  return { is_valid: true, reason: 'Valid (fallback check)' };
};

const validateImprovement = async (text) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${ML_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch (err) {
    console.warn('ML service unavailable, using fallback:', err.message);
    return fallbackValidate(text);
  }
};

const analyzeBatch = async (entries) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${ML_SERVICE_URL}/analyze-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch (err) {
    console.warn('ML service unavailable, using fallback for batch:', err.message);
    const results = entries.map((e) => {
      const check = fallbackValidate(e.text || '');
      return { ...check, subject: e.subject, faculty: e.faculty, keywords: [], sentiment: null };
    });
    return { all_valid: results.every((r) => r.is_valid), results };
  }
};

const getSentiment = async (text) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${ML_SERVICE_URL}/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return await response.json();
  } catch {
    return { sentiment: 'neutral', score: 5, confidence: 0 };
  }
};

module.exports = { validateImprovement, analyzeBatch, getSentiment, fallbackValidate };