'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  CheckCircle2, 
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
  Timer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';

type Exercise = {
  id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  rpe: string;
  rest_seconds: number;
  notes: string;
  video_url: string;
  completedSets: number; // Local state to track progress
};

type WorkoutDay = {
  id: string;
  title: string;
  day_number: number;
  week_title: string;
  exercises: Exercise[];
};

export default function WorkoutSessionPage({ params }: { params: Promise<{ day_id: string }> }) {
  const router = useRouter();
  const { day_id } = use(params);
  const { supabase, session } = useSupabase();
  
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    fetchWorkoutAndLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
        interval = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetTimer = () => {
      setIsTimerRunning(false);
      setTimer(0);
  };

  const fetchWorkoutAndLogs = async () => {
    try {
      if (!session?.user) return;

      // 1. Fetch Workout Day Details
      const { data: day, error: dayError } = await supabase!
        .from('wff_program_days')
        .select('*')
        .eq('id', day_id)
        .single();

      if (dayError || !day) throw dayError || new Error('Day not found');

      // 2. Fetch Week Details separately
      const { data: week } = await supabase!
        .from('wff_program_weeks')
        .select('title, week_number, program_id')
        .eq('id', day.week_id)
        .single();

      // 3. Fetch Exercises separately
      const { data: exercises } = await supabase!
        .from('wff_program_exercises')
        .select('*')
        .eq('day_id', day_id)
        .order('order_index');

      // 4. Fetch Existing Logs for this day
      const { data: logs } = await supabase!
        .from('wff_user_workout_logs')
        .select('exercise_id, set_number')
        .eq('user_id', session.user.id)
        .eq('day_id', day_id);

      // Map logs to a lookup object: { "exerciseId-setNum": true }
      const completedMap = new Set(logs?.map(l => `${l.exercise_id}-${l.set_number}`));

      // Format data
      const formattedWorkout: WorkoutDay = {
          id: day.id,
          title: day.title || `Day ${day.day_number}`,
          day_number: day.day_number,
          week_title: week?.title || `Week ${week?.week_number}`,
          exercises: (exercises || []).map((ex: any) => {
                // Calculate how many sets are completed based on logs
                let completedCount = 0;
                for (let i = 0; i < (ex.sets || 0); i++) {
                    if (completedMap.has(`${ex.id}-${i}`)) {
                        completedCount++;
                    }
                }
                return {
                    ...ex,
                    completedSets: completedCount
                };
            })
      };

      setWorkout(formattedWorkout);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load workout');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSetComplete = async (exerciseIndex: number, targetSetIndex: number) => {
      if (!workout || !session?.user) return;
      
      // Haptic feedback for tactile feel
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
      }
      
      const newWorkout = { ...workout };
      const exercise = newWorkout.exercises[exerciseIndex];
      const currentCompletedCount = exercise.completedSets;
      
      // Case 1: Checking the next available set
      if (targetSetIndex === currentCompletedCount) {
          if (!isTimerRunning) setIsTimerRunning(true);
          // Optimistic Update
          exercise.completedSets += 1;
          setWorkout(newWorkout);

          try {
              const { data: dayData } = await supabase!
                .from('wff_program_days')
                .select('week_id, wff_program_weeks(program_id)')
                .eq('id', day_id)
                .single();
                
              const programId = (dayData as any)?.wff_program_weeks?.program_id;

              if (programId) {
                  await supabase!
                    .from('wff_user_workout_logs')
                    .insert({
                        user_id: session.user.id,
                        program_id: programId,
                        day_id: day_id,
                        exercise_id: exercise.id,
                        set_number: targetSetIndex,
                        reps_completed: parseInt(exercise.reps) || 0,
                        weight_kg: 0,
                    });
              }
              
              // Auto-advance if finished
              if (exercise.completedSets === exercise.sets && exerciseIndex < workout.exercises.length - 1) {
                  setTimeout(() => {
                      setActiveExerciseIndex(exerciseIndex + 1);
                      toast.success(`${exercise.exercise_name} completed!`, {
                          description: "Moving to next exercise..."
                      });
                  }, 500); // Small delay for visual feedback
              }

          } catch (err) {
              console.error('Failed to log set', err);
              toast.error('Failed to save progress');
              // Revert optimistic update
              exercise.completedSets -= 1;
              setWorkout({ ...workout });
          }
      } 
      // Case 2: Unchecking the last completed set
      else if (targetSetIndex === currentCompletedCount - 1) {
          // Optimistic Update
          exercise.completedSets -= 1;
          setWorkout(newWorkout);

          try {
              const { error } = await supabase!
                .from('wff_user_workout_logs')
                .delete()
                .eq('user_id', session.user.id)
                .eq('day_id', day_id)
                .eq('exercise_id', exercise.id)
                .eq('set_number', targetSetIndex);

              if (error) throw error;
          } catch (err) {
              console.error('Failed to uncheck set', err);
              toast.error('Failed to update progress');
              // Revert optimistic update
              exercise.completedSets += 1;
              setWorkout({ ...workout });
          }
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
      if (!workout) return 0;
      const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
      const completedSets = workout.exercises.reduce((acc, ex) => acc + ex.completedSets, 0);
      return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  };

  const finishWorkout = () => {
      toast.success("Workout Complete!", {
          description: `Great job! Duration: ${formatTime(timer)}`
      });
      // TODO: Save log to DB
      router.push('/dashboard');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Handle various YT formats
        let videoId = null;
        if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
        
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
        }
    }
    return null; 
  };

  if (loading || !workout) {
      return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading Workout...</div>;
  }

  const activeExercise = workout.exercises[activeExerciseIndex];
  const activeVideoUrl = getEmbedUrl(activeExercise.video_url);

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                  <h1 className="font-bold text-sm leading-none">{workout.title}</h1>
                  <p className="text-xs text-white/50">{workout.week_title}</p>
              </div>
          </div>
          <div className="flex items-center gap-1">
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${isTimerRunning ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}
                onClick={toggleTimer}
              >
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="font-mono text-sm font-medium">{formatTime(timer)}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white" onClick={resetTimer}>
                  <RotateCcw className="h-3.5 w-3.5" />
              </Button>
          </div>
      </div>

      {/* Progress Bar */}
      <Progress value={calculateProgress()} className="h-1 bg-white/10 rounded-none sticky top-[60px] z-20" />

      <div className="max-w-md mx-auto p-4 space-y-6">
          
          {/* Active Exercise Card */}
          <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              {activeVideoUrl ? (
                   <iframe 
                        key={activeVideoUrl}
                        src={activeVideoUrl} 
                        className="w-full h-full object-cover" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                   />
              ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                      <PlayCircle className="h-16 w-16 mb-2" />
                      <span className="text-xs uppercase tracking-widest">No Video</span>
                  </div>
              )}
              {/* Overlay Content */}
              {!activeVideoUrl && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12 pointer-events-none">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{activeExercise.exercise_name}</h2>
                        </div>
                    </div>
                </div>
              )}
              
              {/* Info Button Overlay (Always visible) */}
              <div className="absolute top-2 right-2">
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-black/50 hover:bg-black/70 border border-white/20 text-white backdrop-blur-sm">
                            <Info className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="bg-neutral-900 border-white/10 text-white h-[50vh]">
                        <SheetHeader>
                            <SheetTitle className="text-white text-xl">{activeExercise.exercise_name}</SheetTitle>
                        </SheetHeader>
                        <div className="py-6 space-y-4">
                            <div className="flex gap-4 border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-xs text-white/50 uppercase">Target Sets</p>
                                    <p className="text-2xl font-bold">{activeExercise.sets}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/50 uppercase">Target Reps</p>
                                    <p className="text-2xl font-bold">{activeExercise.reps}</p>
                                </div>
                                {activeExercise.rpe && (
                                    <div>
                                        <p className="text-xs text-white/50 uppercase">RPE</p>
                                        <p className="text-2xl font-bold text-orange-400">{activeExercise.rpe}</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-white/50 mb-2 font-bold uppercase">Coach Notes</p>
                                <p className="text-white/80 leading-relaxed">
                                    {activeExercise.notes || "No specific instructions provided."}
                                </p>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
              </div>
          </div>
          
          {/* Header Info (Outside video for clarity) */}
          <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{activeExercise.exercise_name}</h2>
              <div className="flex gap-2">
                 <Badge variant="outline" className="border-white/20 text-white/70">{activeExercise.sets} Sets</Badge>
                 <Badge variant="outline" className="border-white/20 text-white/70">{activeExercise.reps} Reps</Badge>
              </div>
          </div>

          {/* Sets Tracker */}
          <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/50 uppercase tracking-widest px-2">
                  <span>Progress</span>
                  <span>{activeExercise.completedSets} / {activeExercise.sets} Completed</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: activeExercise.sets }).map((_, i) => {
                      const isCompleted = i < activeExercise.completedSets;
                      const isNext = i === activeExercise.completedSets;
                      const isLastCompleted = i === activeExercise.completedSets - 1;

                      return (
                          <div 
                              key={i}
                              onClick={() => (isNext || isLastCompleted) && handleSetComplete(activeExerciseIndex, i)}
                              className={`
                                  h-16 rounded-xl border flex items-center justify-between px-4 transition-all duration-300 cursor-pointer select-none active:scale-95
                                  ${isCompleted 
                                      ? 'bg-green-500/10 border-green-500/30 hover:bg-red-500/10 hover:border-red-500/50 group' 
                                      : isNext 
                                          ? 'bg-white/10 border-white/40 ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                          : 'bg-transparent border-white/5 opacity-40'
                                  }
                              `}
                          >
                              <div className="flex items-center gap-4">
                                  <div className={`
                                      h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                                      ${isCompleted ? 'bg-green-500 border-green-500 text-black group-hover:bg-red-500 group-hover:border-red-500 group-hover:text-white' : isNext ? 'border-white text-white scale-110' : 'border-white/20 text-white/20'}
                                  `}>
                                      {isCompleted ? <CheckCircle2 className="h-5 w-5 group-hover:hidden" /> : i + 1}
                                      {isCompleted && <span className="hidden group-hover:inline">✕</span>}
                                  </div>
                                  <div>
                                      <p className={`font-bold ${isCompleted ? 'text-green-400 group-hover:text-red-400' : 'text-white'}`}>
                                          {isCompleted ? 'Completed' : `Set ${i + 1}`}
                                      </p>
                                      {!isCompleted && (
                                        <p className="text-xs text-white/50">{activeExercise.reps} Reps</p>
                                      )}
                                  </div>
                              </div>
                              {isNext && (
                                  <Badge className="bg-white text-black hover:bg-white/90 animate-pulse">Log Set</Badge>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

      </div>

      {/* Bottom Nav / Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 z-10">
          <div className="max-w-md mx-auto flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl border-white/20 bg-black/50 text-white hover:bg-white/10 hover:text-white transition-all active:scale-95"
                onClick={() => setActiveExerciseIndex(Math.max(0, activeExerciseIndex - 1))}
                disabled={activeExerciseIndex === 0}
              >
                  <ChevronLeft className="mr-2 h-5 w-5" /> Prev
              </Button>
              
              {activeExerciseIndex === workout.exercises.length - 1 && activeExercise.completedSets === activeExercise.sets ? (
                  <Button 
                    className="flex-[2] h-12 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95"
                    onClick={finishWorkout}
                  >
                      Finish Workout
                  </Button>
              ) : (
                  <Button 
                    className="flex-[2] h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    onClick={() => setActiveExerciseIndex(Math.min(workout.exercises.length - 1, activeExerciseIndex + 1))}
                  >
                      Next Exercise <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
              )}
          </div>
      </div>
    </div>
  );
}