import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = env.match(/OPENAI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

async function test() {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }]
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
