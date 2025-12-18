'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Dumbbell
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Types reflecting our DB schema
type Exercise = {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rpe: string;
  rest_seconds: number;
  notes: string;
};

type Day = {
  id?: string;
  day_number: number;
  title: string;
  exercises: Exercise[];
};

type Week = {
  id?: string;
  week_number: number;
  title: string;
  days: Day[];
};

export default function ProgramEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrap params
  const { supabase, session } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  
  // State for the builder
  const [weeks, setWeeks] = useState<Week[]>([]);

  useEffect(() => {
    if (!supabase || !id) {
        console.log('Waiting for supabase or id...', { supabase: !!supabase, id });
        return;
    }
    fetchProgramData();
  }, [supabase, id]);

  const fetchProgramData = async () => {
    console.log('Starting fetchProgramData for ID:', id);
    try {
      // 1. Fetch Program Info
      console.log('Fetching program metadata...');
      const { data: program, error: progError } = await supabase!
        .from('programs')
        .select('title, duration_weeks')
        .eq('id', id)
        .single();

      if (progError) {
          console.error('Program fetch error:', progError);
          throw progError;
      }
      console.log('Program metadata loaded:', program);
      setProgramTitle(program.title);

      // 2. Fetch Hierarchy (Weeks -> Days -> Exercises)
      console.log('Fetching program hierarchy...');
      const { data: existingWeeks, error: weeksError } = await supabase!
        .from('program_weeks')
        .select(`
          id, 
          week_number, 
          title,
          program_days (
            id,
            day_number,
            title,
            program_exercises (
              id,
              exercise_name,
              sets,
              reps,
              rpe,
              rest_seconds,
              notes,
              order_index
            )
          )
        `)
        .eq('program_id', id)
        .order('week_number');

      if (weeksError) {
          console.error('Weeks fetch error:', weeksError);
          throw weeksError;
      }
      console.log('Hierarchy loaded:', existingWeeks?.length, 'weeks found');

      if (existingWeeks && existingWeeks.length > 0) {
        // Transform DB data to State
        const formattedWeeks: Week[] = existingWeeks.map(w => ({
          id: w.id,
          week_number: w.week_number,
          title: w.title || `Week ${w.week_number}`,
          days: w.program_days?.sort((a,b) => a.day_number - b.day_number).map(d => ({
             id: d.id,
             day_number: d.day_number,
             title: d.title || `Day ${d.day_number}`,
             exercises: (d.program_exercises || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
          })) || []
        }));
        setWeeks(formattedWeeks);
      } else {
        // Initialize empty weeks based on duration
        const duration = program.duration_weeks || 4; // Default to 4 if null
        console.log('Initializing empty state with duration:', duration);
        const initialWeeks = Array.from({ length: duration }).map((_, i) => ({
           week_number: i + 1,
           title: `Week ${i + 1}`,
           days: []
        }));
        setWeeks(initialWeeks);
      }

    } catch (error: any) {
      console.error('CRITICAL ERROR in fetchProgramData:', error);
      toast.error('Error loading program', { description: error.message });
    } finally {
      console.log('Finished fetchProgramData, setting isLoading to false');
      setIsLoading(false);
    }
  };

  // --- Actions ---

  const addDay = (weekIndex: number) => {
    const newWeeks = [...weeks];
    const currentDays = newWeeks[weekIndex].days;
    newWeeks[weekIndex].days.push({
      day_number: currentDays.length + 1,
      title: `Day ${currentDays.length + 1}`,
      exercises: []
    });
    setWeeks(newWeeks);
  };

  const addExercise = (weekIndex: number, dayIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].days[dayIndex].exercises.push({
      exercise_name: '',
      sets: 3,
      reps: '10',
      rpe: '8',
      rest_seconds: 60,
      notes: ''
    });
    setWeeks(newWeeks);
  };

  const updateExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newWeeks = [...weeks];
    
    // Safety check for number fields
    let safeValue = value;
    if (field === 'sets' || field === 'rest_seconds') {
        safeValue = isNaN(value) ? 0 : value;
    }

    newWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex] = {
        ...newWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex],
        [field]: safeValue
    };
    setWeeks(newWeeks);
  };

  const removeExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
      const newWeeks = [...weeks];
      newWeeks[weekIndex].days[dayIndex].exercises.splice(exerciseIndex, 1);
      setWeeks(newWeeks);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // This is a "naive" save strategy: Delete all old structure and recreate.
        // For a production app, you'd want to upsert/diff to preserve IDs and logs.
        // BUT for MVP, it ensures sync without complex diffing logic.
        
        // 1. Delete existing structure (Cascading delete handles children)
        // Only if we fetched existing IDs. 
        // Actually, safer to UPSERT. But Supabase doesn't support deep nested upsert easily.
        // Let's just create active weeks.
        
        // Strategy: Iterate and Insert.
        for (const week of weeks) {
            // A. Insert/Get Week
            let weekId = week.id;
            if (!weekId) {
                const { data: wData, error: wError } = await supabase!
                    .from('program_weeks')
                    .insert({ program_id: id, week_number: week.week_number, title: week.title })
                    .select('id')
                    .single();
                if (wError) throw wError;
                weekId = wData.id;
            }

            for (const day of week.days) {
                // B. Insert/Get Day
                let dayId = day.id;
                if (!dayId) {
                     const { data: dData, error: dError } = await supabase!
                        .from('program_days')
                        .insert({ week_id: weekId, day_number: day.day_number, title: day.title })
                        .select('id')
                        .single();
                     if (dError) throw dError;
                     dayId = dData.id;
                }

                // C. Sync Exercises (Delete old for this day, Insert new)
                // We wipe exercises for the day and re-add to manage order/deletions simply
                if (dayId) {
                    await supabase!.from('program_exercises').delete().eq('day_id', dayId);
                    
                    const exercisesToInsert = day.exercises.map((ex, idx) => ({
                        day_id: dayId,
                        exercise_name: ex.exercise_name,
                        sets: ex.sets,
                        reps: ex.reps,
                        rpe: ex.rpe,
                        rest_seconds: ex.rest_seconds,
                        notes: ex.notes,
                        order_index: idx
                    }));
                    
                    if (exercisesToInsert.length > 0) {
                        const { error: exError } = await supabase!
                            .from('program_exercises')
                            .insert(exercisesToInsert);
                        if (exError) throw exError;
                    }
                }
            }
        }

        toast.success('Program saved successfully');
        // Refresh data to get new IDs
        fetchProgramData();
        
    } catch (error: any) {
        console.error(error);
        toast.error('Failed to save', { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => router.back()}>
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>
             <div>
                 <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-md">{programTitle}</h1>
                 <p className="text-xs text-muted-foreground">Program Builder</p>
             </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4">
          <Accordion type="multiple" defaultValue={['week-1']} className="space-y-4">
             {weeks.map((week, wIdx) => (
                 <AccordionItem key={wIdx} value={`week-${week.week_number}`} className="bg-background border rounded-lg px-4">
                     <AccordionTrigger className="hover:no-underline">
                         <div className="flex items-center gap-4">
                             <span className="font-bold text-lg text-muted-foreground">Week {week.week_number}</span>
                             <span className="text-sm font-normal text-muted-foreground">{week.days.length} Days</span>
                         </div>
                     </AccordionTrigger>
                     <AccordionContent className="pt-4 space-y-6">
                         {week.days.length === 0 ? (
                             <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                 <p className="text-muted-foreground mb-4">No workout days added yet.</p>
                                 <Button variant="outline" onClick={() => addDay(wIdx)}>
                                     <Plus className="mr-2 h-4 w-4" /> Add Day 1
                                 </Button>
                             </div>
                         ) : (
                             <div className="space-y-6">
                                 {week.days.map((day, dIdx) => (
                                     <Card key={dIdx} className="border shadow-sm">
                                         <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    D{day.day_number}
                                                </div>
                                                <Input 
                                                    value={day.title} 
                                                    onChange={(e) => {
                                                        const newWeeks = [...weeks];
                                                        newWeeks[wIdx].days[dIdx].title = e.target.value;
                                                        setWeeks(newWeeks);
                                                    }}
                                                    className="h-8 w-[200px] font-medium bg-transparent border-transparent hover:border-input focus:bg-background"
                                                />
                                             </div>
                                         </CardHeader>
                                         <CardContent className="p-4 space-y-3">
                                             {day.exercises.map((ex, eIdx) => (
                                                 <div key={eIdx} className="flex gap-3 items-start p-3 rounded-md bg-muted/10 border hover:border-primary/30 transition-colors group">
                                                     <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                                                     <div className="grid grid-cols-12 gap-3 flex-1">
                                                         <div className="col-span-12 sm:col-span-4">
                                                             <Label className="text-xs text-muted-foreground">Exercise</Label>
                                                             <Input 
                                                                placeholder="e.g. Squat" 
                                                                value={ex.exercise_name}
                                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'exercise_name', e.target.value)}
                                                             />
                                                         </div>
                                                         <div className="col-span-3 sm:col-span-2">
                                                             <Label className="text-xs text-muted-foreground">Sets</Label>
                                                             <Input 
                                                                type="number" 
                                                                value={ex.sets || ''}
                                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'sets', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                             />
                                                         </div>
                                                         <div className="col-span-3 sm:col-span-2">
                                                             <Label className="text-xs text-muted-foreground">Reps</Label>
                                                             <Input 
                                                                value={ex.reps}
                                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'reps', e.target.value)}
                                                             />
                                                         </div>
                                                         <div className="col-span-3 sm:col-span-2">
                                                             <Label className="text-xs text-muted-foreground">RPE</Label>
                                                             <Input 
                                                                value={ex.rpe}
                                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'rpe', e.target.value)}
                                                             />
                                                         </div>
                                                         <div className="col-span-3 sm:col-span-2">
                                                             <Label className="text-xs text-muted-foreground">Rest (s)</Label>
                                                             <Input 
                                                                type="number"
                                                                value={ex.rest_seconds || ''}
                                                                onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'rest_seconds', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                             />
                                                         </div>
                                                     </div>
                                                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 mt-5" onClick={() => removeExercise(wIdx, dIdx, eIdx)}>
                                                         <Trash2 className="h-4 w-4" />
                                                     </Button>
                                                 </div>
                                             ))}
                                             <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addExercise(wIdx, dIdx)}>
                                                 <Plus className="mr-2 h-3 w-3" /> Add Exercise
                                             </Button>
                                         </CardContent>
                                     </Card>
                                 ))}
                                 <div className="flex justify-center pt-2">
                                     <Button variant="secondary" size="sm" onClick={() => addDay(wIdx)}>
                                         <Plus className="mr-2 h-4 w-4" /> Add Day {week.days.length + 1}
                                     </Button>
                                 </div>
                             </div>
                         )}
                     </AccordionContent>
                 </AccordionItem>
             ))}
          </Accordion>
      </div>
    </div>
  );
}
