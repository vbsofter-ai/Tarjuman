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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  console.log('List of all model names:');
  const response = await ai.models.list();
  // Try direct array first
  if (response.models) {
    for (const model of response.models) {
      console.log(model.name);
    }
  } else {
    // Try as iterator
    for await (const model of response) {
      console.log(model.name);
    }
  }
}
run().catch(console.error);
