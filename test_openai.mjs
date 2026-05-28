import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function test() {
  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [{ role: 'user', content: 'test' }],
    });
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\nDone.');
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
