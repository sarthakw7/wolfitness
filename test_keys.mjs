import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function test() {
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [{ role: 'user', content: 'test' }],
  });
  console.log(Object.keys(result));
}
test();
