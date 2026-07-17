const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

console.log('Using API Key:', process.env.GEMINI_API_KEY ? 'FOUND' : 'MISSING');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Hello, respond with exactly one word: Success.'
}).then(r => console.log('Response:', r.text))
  .catch(e => console.error('Error:', e));
