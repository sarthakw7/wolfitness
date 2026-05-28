"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { addSmartMealLog } from '@/services/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Send } from 'lucide-react';
import { toast } from 'sonner';

interface EstimatedMacros {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function SmartLogInput() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<EstimatedMacros | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setPreview(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/ai/nutrition/estimate`
        : '/api/ai/nutrition/estimate';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ food: input })
      });

      if (!res.ok) throw new Error('Failed to estimate macros');
      
      const payload = await res.json();
      setPreview(payload);
    } catch (e: any) {
      toast.error('AI Analysis Failed: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthenticated');

      await addSmartMealLog(session.user.id, {
        food_name: preview.food_name,
        meal_category: 'Smart Input',
        calories: Number(preview.calories),
        protein: Number(preview.protein),
        carbs: Number(preview.carbs),
        fat: Number(preview.fat),
        logged_at: new Date().toISOString().split('T')[0]
      });

      toast.success('Fuel logged successfully. ⚡️');
      setInput('');
      setPreview(null);
    } catch (e: any) {
      toast.error('Failed to log meal: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-black border border-zinc-800 p-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">WFF Neural Input</h3>
      </div>
      
      {!preview ? (
        <div className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.G. '2 EGGS AND BLACK COFFEE'"
            disabled={isAnalyzing}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            className="flex-1 rounded-none border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 h-12 uppercase text-xs font-bold tracking-widest"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !input.trim()}
            className="rounded-none bg-white text-black hover:bg-zinc-200 h-12 px-6"
          >
            {isAnalyzing ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-emerald-900/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Preview Target</p>
              <h4 className="text-lg font-black uppercase tracking-tighter text-white">{preview.food_name}</h4>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-400">{preview.calories}</span>
              <span className="text-[10px] text-zinc-500 font-bold tracking-widest ml-1">KCAL</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-black border border-zinc-800 p-2 text-center">
              <span className="block text-sm font-black text-white">{preview.protein}g</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Protein</span>
            </div>
            <div className="bg-black border border-zinc-800 p-2 text-center">
              <span className="block text-sm font-black text-white">{preview.carbs}g</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Carbs</span>
            </div>
            <div className="bg-black border border-zinc-800 p-2 text-center">
              <span className="block text-sm font-black text-white">{preview.fat}g</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Fat</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPreview(null)}
              disabled={isSaving}
              className="flex-1 rounded-none border-zinc-800 bg-black text-white hover:bg-zinc-900 hover:text-white uppercase tracking-widest text-[10px] font-bold h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isSaving}
              className="flex-1 rounded-none bg-emerald-500 hover:bg-emerald-600 text-black uppercase tracking-widest text-[10px] font-black h-10"
            >
              {isSaving ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : null}
              Confirm & Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
