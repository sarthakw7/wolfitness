'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cloneTemplate } from './actions';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function CloneButton({ templateId }: { templateId: string }) {
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async () => {
    try {
      setIsCloning(true);
      await cloneTemplate(templateId);
    } catch (error: any) {
      if (error.digest?.includes('NEXT_REDIRECT')) {
        return;
      }
      toast.error('Failed to clone template', {
        description: error.message,
      });
      setIsCloning(false);
    }
  };

  return (
    <Button 
      onClick={handleClone} 
      disabled={isCloning} 
      className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
      Clone & Sell
    </Button>
  );
}
