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
  ExternalLink,
  Utensils,
  Dumbbell
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { ExercisePicker, GlobalExercise } from '@/components/dashboard/ExercisePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';

// --- TYPES ---

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

type MealItem = {
    id?: string;
    food_name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes?: string;
};

type Meal = {
    id?: string;
    title: string;
    description?: string;
    items: MealItem[];
};

type NutritionPlan = {
    id?: string;
    title: string;
    description: string;
    meals: Meal[];
};

export default function ProgramEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { supabase, session } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  
  // State for Training
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [globalExercises, setGlobalExercises] = useState<GlobalExercise[]>([]);

  // State for Nutrition
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan>({
      title: '',
      description: '',
      meals: []
  });

  const fetchGlobalExercises = useCallback(async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('exercises_library')
        .select('*')
        .order('name');
      
      if (error) {
          console.error('Error fetching exercises:', error);
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

      // 2. Fetch Training Hierarchy
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
        const formattedWeeks: Week[] = existingWeeks.map((w) => ({
          id: w.id,
          week_number: w.week_number,
          title: w.title || `Week ${w.week_number}`,
          days: w.program_days?.sort((a, b) => a.day_number - b.day_number).map((d) => ({
             id: d.id,
             day_number: d.day_number,
             title: d.title || `Day ${d.day_number}`,
             exercises: (d.program_exercises || [])
               .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) as Exercise[]
          })) || []
        }));
        setWeeks(formattedWeeks);
      } else {
        const duration = program.duration_weeks || 4;
        const initialWeeks = Array.from({ length: duration }).map((_, i) => ({
           week_number: i + 1,
           title: `Week ${i + 1}`,
           days: []
        }));
        setWeeks(initialWeeks);
      }

      // 3. Fetch Nutrition Plan
      const { data: nPlan, error: nPlanError } = await supabase
        .from('nutrition_plans')
        .select(`
            id,
            title,
            description,
            meals (
                id,
                title,
                description,
                order_index,
                meal_items (
                    id,
                    food_name,
                    quantity,
                    calories,
                    protein,
                    carbs,
                    fat,
                    notes,
                    order_index
                )
            )
        `)
        .eq('program_id', id)
        .maybeSingle();

      if (nPlanError) throw nPlanError;

      if (nPlan) {
          setNutritionPlan({
              id: nPlan.id,
              title: nPlan.title,
              description: nPlan.description || '',
              meals: (nPlan.meals || []).sort((a, b) => a.order_index - b.order_index).map(m => ({
                  id: m.id,
                  title: m.title,
                  description: m.description || '',
                  items: (m.meal_items || []).sort((a, b) => a.order_index - b.order_index).map(i => ({
                      id: i.id,
                      food_name: i.food_name,
                      quantity: i.quantity || '',
                      calories: i.calories || 0,
                      protein: Number(i.protein) || 0,
                      carbs: Number(i.carbs) || 0,
                      fat: Number(i.fat) || 0,
                      notes: i.notes || ''
                  }))
              }))
          });
      }

    } catch (error: any) {
      console.error('CRITICAL ERROR in fetchProgramData:', error);
      toast.error('Error loading program', { description: error.message });
    }
  }, [supabase, id]);

  useEffect(() => {
    if (!supabase || !id) return;
    const init = async () => {
        setIsLoading(true);
        await Promise.all([fetchProgramData(), fetchGlobalExercises()]);
        setIsLoading(false);
    };
    init();
  }, [supabase, id, fetchProgramData, fetchGlobalExercises]);

  // --- TRAINING ACTIONS ---

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
      notes: '',
      video_url: ''
    });
    setWeeks(newWeeks);
  };

  const updateExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newWeeks = [...weeks];
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

  // --- NUTRITION ACTIONS ---

  const addMeal = () => {
      setNutritionPlan({
          ...nutritionPlan,
          meals: [...nutritionPlan.meals, { title: 'New Meal', items: [] }]
      });
  };

  const removeMeal = (mIdx: number) => {
      const newMeals = [...nutritionPlan.meals];
      newMeals.splice(mIdx, 1);
      setNutritionPlan({ ...nutritionPlan, meals: newMeals });
  };

  const addMealItem = (mIdx: number) => {
      const newMeals = [...nutritionPlan.meals];
      newMeals[mIdx].items.push({
          food_name: '',
          quantity: '',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
      });
      setNutritionPlan({ ...nutritionPlan, meals: newMeals });
  };

  const updateMealItem = (mIdx: number, iIdx: number, field: keyof MealItem, value: any) => {
      const newMeals = [...nutritionPlan.meals];
      (newMeals[mIdx].items[iIdx] as any)[field] = value;
      setNutritionPlan({ ...nutritionPlan, meals: newMeals });
  };

  const removeMealItem = (mIdx: number, iIdx: number) => {
      const newMeals = [...nutritionPlan.meals];
      newMeals[mIdx].items.splice(iIdx, 1);
      setNutritionPlan({ ...nutritionPlan, meals: newMeals });
  };

  // --- SAVE ---

  const handleSave = async () => {
    if (!session?.user.id) return;
    setIsSaving(true);
    try {
        // 1. Sync Training (Weeks/Days/Exercises)
        for (const week of weeks) {
            const { data: wData } = await supabase!.from('program_weeks').upsert({
                program_id: id,
                week_number: week.week_number,
                title: week.title
            }, { onConflict: 'program_id, week_number' }).select('id').single();

            const weekId = wData?.id;
            if (weekId) {
                for (const day of week.days) {
                    const { data: dData } = await supabase!.from('program_days').upsert({
                        week_id: weekId,
                        day_number: day.day_number,
                        title: day.title
                    }, { onConflict: 'week_id, day_number' }).select('id').single();

                    const dayId = dData?.id;
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
                            video_url: ex.video_url,
                            order_index: idx
                        }));
                        if (exercisesToInsert.length > 0) {
                            await supabase!.from('program_exercises').insert(exercisesToInsert);
                        }
                    }
                }
            }
        }

        // 2. Sync Nutrition
        if (nutritionPlan.title || nutritionPlan.meals.length > 0) {
            const { data: nData, error: nError } = await supabase!.from('nutrition_plans').upsert({
                id: nutritionPlan.id,
                program_id: id,
                creator_id: session.user.id,
                title: nutritionPlan.title || 'Nutrition Plan',
                description: nutritionPlan.description
            }).select('id').single();

            if (nError) throw nError;
            const nId = nData.id;

            // Delete removed meals (by simple wipe and re-insert for simplicity in MVP)
            await supabase!.from('meals').delete().eq('plan_id', nId);

            for (const [mIdx, meal] of nutritionPlan.meals.entries()) {
                const { data: mData } = await supabase!.from('meals').insert({
                    plan_id: nId,
                    title: meal.title,
                    description: meal.description,
                    order_index: mIdx
                }).select('id').single();

                if (mData?.id) {
                    const itemsToInsert = meal.items.map((item, iIdx) => ({
                        meal_id: mData.id,
                        food_name: item.food_name,
                        quantity: item.quantity,
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                        notes: item.notes,
                        order_index: iIdx
                    }));
                    if (itemsToInsert.length > 0) {
                        await supabase!.from('meal_items').insert(itemsToInsert);
                    }
                }
            }
        }

        toast.success('Program saved successfully');
        await fetchProgramData();
    } catch (error: any) {
        toast.error('Failed to save', { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
                 <p className="text-xs text-muted-foreground">Ecosystem Builder</p>
             </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4">
          <Tabs defaultValue="training" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="training" className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" /> Training
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="flex items-center gap-2">
                      <Utensils className="h-4 w-4" /> Nutrition
                  </TabsTrigger>
              </TabsList>

              {/* --- TRAINING CONTENT --- */}
              <TabsContent value="training" className="space-y-4 outline-none">
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
                                {week.days.map((day, dIdx) => (
                                    <Card key={dIdx} className="border shadow-sm">
                                        <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">D{day.day_number}</div>
                                                <Input value={day.title} onChange={(e) => {
                                                    const newWeeks = [...weeks];
                                                    newWeeks[wIdx].days[dIdx].title = e.target.value;
                                                    setWeeks(newWeeks);
                                                }} className="h-8 w-[200px] font-medium bg-transparent border-transparent hover:border-input focus:bg-background" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            {day.exercises.map((ex, eIdx) => (
                                                <div key={eIdx} className="flex gap-3 items-start p-3 rounded-md bg-muted/10 border hover:border-primary/30 transition-colors">
                                                    <div className="flex-1 grid grid-cols-12 gap-3">
                                                        <div className="col-span-12 sm:col-span-4">
                                                            <ExercisePicker
                                                                value={ex.exercise_name}
                                                                exercises={globalExercises}
                                                                onSelect={(s) => {
                                                                    updateExercise(wIdx, dIdx, eIdx, 'exercise_name', s.name);
                                                                    if (s.video_url) updateExercise(wIdx, dIdx, eIdx, 'video_url', s.video_url);
                                                                }}
                                                                onChangeName={(n) => updateExercise(wIdx, dIdx, eIdx, 'exercise_name', n)}
                                                            />
                                                        </div>
                                                        <div className="col-span-3 sm:col-span-2"><Input type="number" placeholder="Sets" value={ex.sets || ''} onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'sets', parseInt(e.target.value))} /></div>
                                                        <div className="col-span-3 sm:col-span-2"><Input placeholder="Reps" value={ex.reps} onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'reps', e.target.value)} /></div>
                                                        <div className="col-span-3 sm:col-span-2"><Input placeholder="RPE" value={ex.rpe} onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'rpe', e.target.value)} /></div>
                                                        <div className="col-span-3 sm:col-span-2"><Input type="number" placeholder="Rest" value={ex.rest_seconds || ''} onChange={(e) => updateExercise(wIdx, dIdx, eIdx, 'rest_seconds', parseInt(e.target.value))} /></div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => {
                                                        const newWeeks = [...weeks];
                                                        newWeeks[wIdx].days[dIdx].exercises.splice(eIdx, 1);
                                                        setWeeks(newWeeks);
                                                    }}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addExercise(wIdx, dIdx)}><Plus className="mr-2 h-3 w-3" /> Add Exercise</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                <Button variant="secondary" size="sm" onClick={() => addDay(wIdx)}><Plus className="mr-2 h-4 w-4" /> Add Day</Button>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                  </Accordion>
              </TabsContent>

              {/* --- NUTRITION CONTENT --- */}
              <TabsContent value="nutrition" className="space-y-6 outline-none">
                  <Card>
                      <CardHeader>
                          <CardTitle>Core Nutrition Strategy</CardTitle>
                          <CardDescription>Provide a high-level guide for this program.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label>Plan Title</Label>
                              <Input 
                                placeholder="e.g., High Protein Fat Loss" 
                                value={nutritionPlan.title} 
                                onChange={(e) => setNutritionPlan({...nutritionPlan, title: e.target.value})}
                              />
                          </div>
                          <div className="space-y-2">
                              <Label>General Guidelines</Label>
                              <Textarea 
                                placeholder="How should they eat? Timing, hydration, etc." 
                                value={nutritionPlan.description}
                                onChange={(e) => setNutritionPlan({...nutritionPlan, description: e.target.value})}
                              />
                          </div>
                      </CardContent>
                  </Card>

                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold">Meal Slots</h3>
                          <Button size="sm" onClick={addMeal}><Plus className="mr-2 h-4 w-4" /> Add Meal</Button>
                      </div>

                      {nutritionPlan.meals.map((meal, mIdx) => (
                          <Card key={mIdx} className="border shadow-sm overflow-hidden">
                              <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                                  <Input 
                                    value={meal.title} 
                                    onChange={(e) => {
                                        const newMeals = [...nutritionPlan.meals];
                                        newMeals[mIdx].title = e.target.value;
                                        setNutritionPlan({...nutritionPlan, meals: newMeals});
                                    }}
                                    className="h-7 w-[200px] font-bold bg-transparent border-transparent hover:border-input p-1"
                                  />
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 h-8 w-8 p-0" onClick={() => removeMeal(mIdx)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                              <CardContent className="p-4 space-y-4">
                                  {meal.items.map((item, iIdx) => (
                                      <div key={iIdx} className="grid grid-cols-12 gap-3 items-end p-3 rounded bg-muted/20 border group relative">
                                          <div className="col-span-12 sm:col-span-3">
                                              <Label className="text-[10px] uppercase text-muted-foreground">Food Item</Label>
                                              <Input placeholder="Chicken Breast" value={item.food_name} onChange={(e) => updateMealItem(mIdx, iIdx, 'food_name', e.target.value)} />
                                          </div>
                                          <div className="col-span-4 sm:col-span-2">
                                              <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                                              <Input placeholder="200g" value={item.quantity} onChange={(e) => updateMealItem(mIdx, iIdx, 'quantity', e.target.value)} />
                                          </div>
                                          <div className="col-span-4 sm:col-span-1">
                                              <Label className="text-[10px] uppercase text-muted-foreground">Cal</Label>
                                              <Input type="number" value={item.calories || ''} onChange={(e) => updateMealItem(mIdx, iIdx, 'calories', parseInt(e.target.value))} />
                                          </div>
                                          <div className="col-span-4 sm:col-span-1">
                                              <Label className="text-[10px] uppercase text-muted-foreground">P</Label>
                                              <Input type="number" value={item.protein || ''} onChange={(e) => updateMealItem(mIdx, iIdx, 'protein', parseFloat(e.target.value))} />
                                          </div>
                                          <div className="col-span-4 sm:col-span-1">
                                              <Label className="text-[10px] uppercase text-muted-foreground">C</Label>
                                              <Input type="number" value={item.carbs || ''} onChange={(e) => updateMealItem(mIdx, iIdx, 'carbs', parseFloat(e.target.value))} />
                                          </div>
                                          <div className="col-span-4 sm:col-span-1">
                                              <Label className="text-[10px] uppercase text-muted-foreground">F</Label>
                                              <Input type="number" value={item.fat || ''} onChange={(e) => updateMealItem(mIdx, iIdx, 'fat', parseFloat(e.target.value))} />
                                          </div>
                                          <div className="col-span-10 sm:col-span-2">
                                              <Label className="text-[10px] uppercase text-muted-foreground">Notes</Label>
                                              <Input placeholder="Cooked wt" value={item.notes} onChange={(e) => updateMealItem(mIdx, iIdx, 'notes', e.target.value)} />
                                          </div>
                                          <div className="col-span-2 sm:col-span-1 flex justify-end">
                                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => removeMealItem(mIdx, iIdx)}>
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                          </div>
                                      </div>
                                  ))}
                                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addMealItem(mIdx)}>
                                      <Plus className="mr-2 h-4 w-4" /> Add Food
                                  </Button>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </TabsContent>
          </Tabs>
      </div>
    </div>
    </TooltipProvider>
  );
}
