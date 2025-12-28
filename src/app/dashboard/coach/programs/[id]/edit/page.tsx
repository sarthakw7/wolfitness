'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Video,
  StickyNote,
  Copy,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { ExercisePicker, GlobalExercise } from '@/components/dashboard/ExercisePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types reflecting our DB schema
type Exercise = {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rpe: string;
  rest_seconds: number;
  notes: string;
  video_url?: string;
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
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  
  // State for the builder
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [globalExercises, setGlobalExercises] = useState<GlobalExercise[]>([]);

  const fetchGlobalExercises = useCallback(async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('global_exercises')
        .select('*')
        .order('name');
      
      if (error) {
          console.error('Error fetching exercises:', error);
          toast.error('Failed to load exercise library');
      } else {
          setGlobalExercises(data || []);
      }
  }, [supabase]);

  const fetchProgramData = useCallback(async () => {
    if (!supabase || !id) return;
    try {
      // 1. Fetch Program Info
      const { data: program, error: progError } = await supabase
        .from('programs')
        .select('title, duration_weeks')
        .eq('id', id)
        .single();

      if (progError) throw progError;
      setProgramTitle(program.title);

      // 2. Fetch Hierarchy (Weeks -> Days -> Exercises)
      const { data: existingWeeks, error: weeksError } = await supabase
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
              video_url,
              order_index
            )
          )
        `)
        .eq('program_id', id)
        .order('week_number');

      if (weeksError) throw weeksError;

      if (existingWeeks && existingWeeks.length > 0) {
        // Transform DB data to State
        const formattedWeeks: Week[] = existingWeeks.map(w => ({
          id: w.id,
          week_number: w.week_number,
          title: w.title || `Week ${w.week_number}`,
          days: w.program_days?.sort((a, b) => a.day_number - b.day_number).map(d => ({
             id: d.id,
             day_number: d.day_number,
             title: d.title || `Day ${d.day_number}`,
             exercises: (d.program_exercises || [])
               .sort((a: { order_index: number }, b: { order_index: number }) => (a.order_index || 0) - (b.order_index || 0))
          })) || []
        }));
        setWeeks(formattedWeeks);
      } else {
        // Initialize empty weeks based on duration
        const duration = program.duration_weeks || 4; // Default to 4 if null
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
    }
  }, [supabase, id]);

  useEffect(() => {
    if (!supabase || !id) {
        return;
    }
    const init = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchProgramData(),
            fetchGlobalExercises()
        ]);
        setIsLoading(false);
    };
    init();
  }, [supabase, id, fetchProgramData, fetchGlobalExercises]);

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

  const duplicateDay = (weekIndex: number, dayIndex: number) => {
    const newWeeks = [...weeks];
    const dayToCopy = newWeeks[weekIndex].days[dayIndex];
    
    // Deep copy exercises to avoid reference issues and clear IDs
    const copiedExercises = dayToCopy.exercises.map(ex => ({ ...ex, id: undefined })); 
    
    newWeeks[weekIndex].days.push({
        day_number: newWeeks[weekIndex].days.length + 1,
        title: `${dayToCopy.title} (Copy)`,
        exercises: copiedExercises
    });
    setWeeks(newWeeks);
    toast.success('Day duplicated');
  };

  const addExercise = (weekIndex: number, dayIndex: number) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].days[dayIndex].exercises.push({
      exercise_name: '',
      sets: 3,
      reps: '10',
      rpe: '8',
      rest_seconds: 60,
      notes: '',
      video_url: ''
    });
    setWeeks(newWeeks);
  };

  const duplicateExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const newWeeks = [...weeks];
    const exercises = newWeeks[weekIndex].days[dayIndex].exercises;
    const exToCopy = exercises[exerciseIndex];
    
    const newExercise = { ...exToCopy, id: undefined }; // Clear ID
    
    exercises.splice(exerciseIndex + 1, 0, newExercise);
    setWeeks(newWeeks);
  };

  const moveExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number, direction: 'up' | 'down') => {
    const newWeeks = [...weeks];
    const exercises = newWeeks[weekIndex].days[dayIndex].exercises;
    
    if (direction === 'up' && exerciseIndex > 0) {
        [exercises[exerciseIndex], exercises[exerciseIndex - 1]] = [exercises[exerciseIndex - 1], exercises[exerciseIndex]];
    } else if (direction === 'down' && exerciseIndex < exercises.length - 1) {
        [exercises[exerciseIndex], exercises[exerciseIndex + 1]] = [exercises[exerciseIndex + 1], exercises[exerciseIndex]];
    }
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

  const updateExerciseFromPicker = (weekIndex: number, dayIndex: number, exerciseIndex: number, selected: GlobalExercise) => {
    const newWeeks = [...weeks];
    const target = newWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex];
    
    target.exercise_name = selected.name;
    // Auto-fill video if available
    if (selected.video_url) {
        target.video_url = selected.video_url;
    }
    
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
        // Strategy: Lookup-First Sync
        // We ensure we match existing Weeks/Days by their natural keys (program_id + week_number, week_id + day_number)
        // to prevent duplicates.
        
        for (const week of weeks) {
            let weekId = week.id;
            
            // 1. Resolve Week ID (Find or Insert)
            // Try to find existing week by number for this program
            const { data: existingWeek, error: wFetchError } = await supabase!
                .from('program_weeks')
                .select('id')
                .eq('program_id', id)
                .eq('week_number', week.week_number)
                .single(); // Should be unique
            
            if (existingWeek) {
                weekId = existingWeek.id;
                // Optional: Update title if changed
                await supabase!
                    .from('program_weeks')
                    .update({ title: week.title })
                    .eq('id', weekId);
            } else {
                // Insert new
                 const { data: newWeek, error: wInsertError } = await supabase!
                    .from('program_weeks')
                    .insert({ program_id: id, week_number: week.week_number, title: week.title })
                    .select('id')
                    .single();
                 if (wInsertError) throw wInsertError;
                 weekId = newWeek.id;
            }

            for (const day of week.days) {
                let dayId = day.id;

                // 2. Resolve Day ID (Find or Insert)
                const { data: existingDay, error: dFetchError } = await supabase!
                    .from('program_days')
                    .select('id')
                    .eq('week_id', weekId)
                    .eq('day_number', day.day_number)
                    .single();

                if (existingDay) {
                    dayId = existingDay.id;
                    await supabase!
                        .from('program_days')
                        .update({ title: day.title })
                        .eq('id', dayId);
                } else {
                     const { data: newDay, error: dInsertError } = await supabase!
                        .from('program_days')
                        .insert({ week_id: weekId, day_number: day.day_number, title: day.title })
                        .select('id')
                        .single();
                     if (dInsertError) throw dInsertError;
                     dayId = newDay.id;
                }

                // 3. Sync Exercises
                if (dayId) {
                    // Delete ALL existing exercises for this day to perform a clean sync
                    // This handles deletions, reordering, and updates robustly.
                    const { error: delError } = await supabase!
                        .from('program_exercises')
                        .delete()
                        .eq('day_id', dayId);
                    
                    if (delError) throw delError;
                    
                    // Insert current state
                    const exercisesToInsert = day.exercises.map((ex, idx) => ({
                        day_id: dayId,
                        exercise_name: ex.exercise_name,
                        sets: ex.sets,
                        reps: ex.reps,
                        rpe: ex.rpe,
                        rest_seconds: ex.rest_seconds,
                        notes: ex.notes,
                        video_url: ex.video_url,
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
        // Refresh data to get new IDs and clean state
        await fetchProgramData();
        
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
    <TooltipProvider>
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
                                             <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => duplicateDay(wIdx, dIdx)}>
                                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Duplicate Day</p></TooltipContent>
                                             </Tooltip>
                                         </CardHeader>
                                         <CardContent className="p-4 space-y-3">
                                             {day.exercises.map((ex, eIdx) => (
                                                 <div key={eIdx} className="flex gap-3 items-start p-3 rounded-md bg-muted/10 border hover:border-primary/30 transition-colors group">
                                                     {/* Move Controls */}
                                                     <div className="flex flex-col gap-1 mt-1">
                                                         <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                                            disabled={eIdx === 0}
                                                            onClick={() => moveExercise(wIdx, dIdx, eIdx, 'up')}
                                                         >
                                                             <ChevronUp className="h-4 w-4" />
                                                         </Button>
                                                         <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                                            disabled={eIdx === day.exercises.length - 1}
                                                            onClick={() => moveExercise(wIdx, dIdx, eIdx, 'down')}
                                                         >
                                                             <ChevronDown className="h-4 w-4" />
                                                         </Button>
                                                     </div>

                                                     <div className="flex-1 space-y-3">
                                                         {/* Row 1: Main Stats */}
                                                         <div className="grid grid-cols-12 gap-3">
                                                            <div className="col-span-12 sm:col-span-4">
                                                                <Label className="text-xs text-muted-foreground">Exercise</Label>
                                                                <ExercisePicker
                                                                    value={ex.exercise_name}
                                                                    exercises={globalExercises}
                                                                    onSelect={(selected) => updateExerciseFromPicker(wIdx, dIdx, eIdx, selected)}
                                                                    onChangeName={(name) => updateExercise(wIdx, dIdx, eIdx, 'exercise_name', name)}
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

                                                         {/* Row 2: Details (Video & Notes) */}
                                                         <div className="grid grid-cols-12 gap-3 pt-1">
                                                             <div className="col-span-12 sm:col-span-6 relative">
                                                                 {ex.video_url ? (
                                                                     <a 
                                                                        href={ex.video_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="absolute top-2.5 left-2.5 text-blue-500 hover:text-blue-700 z-10"
                                                                     >
                                                                         <ExternalLink className="h-4 w-4" />
                                                                     </a>
                                                                 ) : (
                                                                     <Video className="h-4 w-4 absolute top-2.5 left-2.5 text-muted-foreground" />
                                                                 )}
                                                                 <Input 
                                                                    className="pl-9" 
                                                                    placeholder="Video URL (optional)" 
                                                                    value={ex.video_url || ''}
                                                                    onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'video_url', e.target.value)}
                                                                 />
                                                             </div>
                                                             <div className="col-span-12 sm:col-span-6 relative">
                                                                 <StickyNote className="h-4 w-4 absolute top-2.5 left-2.5 text-muted-foreground" />
                                                                 <Input 
                                                                    className="pl-9" 
                                                                    placeholder="Notes (optional)" 
                                                                    value={ex.notes || ''}
                                                                    onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'notes', e.target.value)}
                                                                 />
                                                             </div>
                                                         </div>
                                                     </div>

                                                     {/* Actions */}
                                                     <div className="flex flex-col gap-1 mt-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-500" onClick={() => duplicateExercise(wIdx, dIdx, eIdx)}>
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Duplicate</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => removeExercise(wIdx, dIdx, eIdx)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Remove</p></TooltipContent>
                                                        </Tooltip>
                                                     </div>
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
    </TooltipProvider>
  );
}
