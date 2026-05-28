"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, RefreshCcw, Send, Zap } from 'lucide-react';

interface NutritionChatProps {
  token: string;
  apiUrl: string;
}

const QUICK_ACTIONS = [
  "What should I eat today?",
  "High protein meal ideas",
  "Fix my diet",
];

function logNutritionChatUi(event: string, context?: Record<string, unknown>) {
  console.info('[nutrition-chat-ui]', event, context ?? {});
}

// Helper to extract text from UIMessage parts or content
function getMessageText(message: any): string {
  if (message.content) return message.content;
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('');
  }
  return '';
}

export function NutritionChat({ token, apiUrl }: NutritionChatProps) {
  const [input, setInput] = useState('');
  const submitLockRef = useRef(false);
  const requestDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          date: requestDate,
        },
      }),
    [apiUrl, requestDate, token],
  );

  const { messages, sendMessage, status, error, clearError, regenerate } = useChat({
    transport,
    onError(chatError) {
      submitLockRef.current = false;
      const message = chatError instanceof Error ? chatError.message : String(chatError);
      const isAuthError = message.includes('401') || message.includes('UNAUTHORIZED') || message.includes('Invalid or Expired Token');

      logNutritionChatUi(isAuthError ? 'auth error' : 'stream error', {
        error: message,
      });
    },
    onFinish() {
      submitLockRef.current = false;
    },
  });

  const isStreaming = status === 'submitted' || status === 'streaming';
  const lastMessage = messages.at(-1) as any;
  const showThinkingIndicator =
    isStreaming && (status === 'submitted' || lastMessage?.role !== 'assistant' || !getMessageText(lastMessage));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendPrompt = async (prompt: string, source: 'send' | 'quick-action') => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isStreaming || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    clearError();
    logNutritionChatUi(source, {
      prompt: trimmedPrompt,
    });

    try {
      await sendMessage({ text: trimmedPrompt });
    } catch (sendError) {
      submitLockRef.current = false;
      logNutritionChatUi('stream error', {
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();

    if (prompt && !isStreaming && !submitLockRef.current) {
      setInput('');
      await sendPrompt(prompt, 'send');
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, error]);

  const handleQuickAction = (prompt: string) => {
    void sendPrompt(prompt, 'quick-action');
  };

  const handleRetry = async () => {
    if (isStreaming || submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    clearError();
    logNutritionChatUi('retry');

    try {
      await regenerate();
    } catch (retryError) {
      submitLockRef.current = false;
      logNutritionChatUi('stream error', {
        error: retryError instanceof Error ? retryError.message : String(retryError),
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] max-h-[80vh] w-full max-w-3xl mx-auto border border-zinc-800 bg-black text-white shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-none border border-zinc-700 bg-zinc-900">
            <AvatarFallback className="bg-transparent text-white rounded-none">AI</AvatarFallback>
          </Avatar>
          <h2 className="text-sm font-bold tracking-widest uppercase">Nutrition Intelligence</h2>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold tracking-widest uppercase animate-pulse">
            <Zap className="h-3 w-3" /> Wolf AI is thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-32"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-8">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p className="text-sm uppercase tracking-widest font-bold">WFF AI Configured</p>
              <p className="text-xs mt-2 max-w-[250px] mx-auto text-zinc-600">
                Your AI coach already knows your training, macros and meals.
              </p>
            </div>
            
            <div className="flex flex-col w-full max-w-[280px] gap-2">
              {QUICK_ACTIONS.map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  onClick={() => handleQuickAction(action)}
                  disabled={isStreaming}
                  className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:text-white text-xs uppercase tracking-widest font-black rounded-none justify-start px-4 h-10"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message: any) => {
            const textContent = getMessageText(message);
            return (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                    message.role === 'user' 
                      ? 'bg-white text-black font-medium rounded-none' 
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-none'
                  }`}
                >
                  {/* Simple mapping for markdown-like bolding from AI */}
                  {textContent.split('\n').map((line: string, i: number) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line.split(/(\*\*.*?\*\*)/g).map((part: string, j: number) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} className={message.role === 'user' ? 'font-black' : 'text-white font-bold'}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {showThinkingIndicator && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-4 text-xs uppercase tracking-widest font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-none animate-pulse">
              Wolf AI is thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-zinc-950 border border-red-900/60 p-4 text-sm text-zinc-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-red-300">Nutrition Intelligence Error</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Wolf AI could not complete that response. Check your connection or session and retry.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isStreaming}
                  className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900 hover:text-white text-xs uppercase tracking-widest font-black rounded-none h-9"
                >
                  <RefreshCcw className="h-3 w-3 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute w-full bottom-0 p-4 bg-gradient-to-t from-black via-black to-transparent border-t border-zinc-800/50">
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-2 bg-zinc-950 p-1 border border-zinc-800 focus-within:border-zinc-600 transition-colors"
        >
          <Input 
            value={input}
            onChange={handleInputChange}
            placeholder="ASK ABOUT YOUR MACROS..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none text-white focus-visible:ring-0 focus-visible:ring-offset-0 text-xs font-bold uppercase tracking-widest placeholder:text-zinc-600 rounded-none h-10"
          />
          <Button 
            type="submit" 
            disabled={isStreaming || !input.trim()} 
            size="icon"
            className="h-10 w-10 bg-white text-black hover:bg-zinc-200 rounded-none shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
