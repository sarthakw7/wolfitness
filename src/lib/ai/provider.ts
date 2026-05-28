import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';

type ProviderKey = 'openai' | 'groq' | 'gemini';
type UseCase = 'chat' | 'estimate';

export function getAiProvider(): ProviderKey {
  return (process.env.AI_PROVIDER as ProviderKey) || 'groq';
}

/**
 * Returns the configured AI model based on the AI_PROVIDER env variable.
 * Fallbacks to 'groq' if undefined, as it is the default free option.
 */
export function getModel(useCase: UseCase): any {
  const provider = getAiProvider();

  switch (provider) {
    case 'openai':
      return openai('gpt-4o-mini');
    
    case 'gemini':
      return google('gemini-1.5-flash');
    
    case 'groq':
    default:
      // We use llama-3.1-8b-instant as it is fast and supports tool/structured generation for the estimate route
      return groq('llama-3.1-8b-instant');
  }
}
