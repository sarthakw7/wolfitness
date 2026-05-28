'use client';

import { useState, useEffect, useCallback } from 'react';
import { Utensils, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NutritionLog = {
    id: string;
    food_name: string;
    meal_category: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    logged_at: string;
};

type MacroTargets = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export function NutritionWidget() {
    const { supabase, session } = useSupabase();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<NutritionLog[]>([]);
    const [profileData, setProfileData] = useState<any>(null);
    const [targets, setTargets] = useState<MacroTargets>({
        calories: 2500,
        protein: 180,
        carbs: 250,
        fat: 70
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [foodName, setFoodName] = useState('');
    const [mealCategory, setMealCategory] = useState('Breakfast');
    const [formCalories, setFormCalories] = useState('');
    const [formProtein, setFormProtein] = useState('');
    const [formCarbs, setFormCarbs] = useState('');
    const [formFat, setFormFat] = useState('');

    const fetchData = useCallback(async () => {
        if (!session?.user.id || !supabase) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch User Targets from macro_targets
            const { data: profile } = await supabase
                .from('macro_targets')
                .select('daily_calorie_target, daily_protein_target, daily_carbs_target, daily_fat_target')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (profile) {
                setProfileData(profile);
                setTargets({
                    calories: profile.daily_calorie_target || 2500,
                    protein: profile.daily_protein_target || 180,
                    carbs: profile.daily_carbs_target || 250,
                    fat: profile.daily_fat_target || 70
                });
            }

            // 2. Fetch Today's Logs
            const { data: logsData, error: logsError } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('logged_at', today);

            if (logsError) throw logsError;
            setLogs(logsData || []);

        } catch (error: any) {
            console.error('Error fetching nutrition data:', error);
        } finally {
            setLoading(false);
        }
    }, [session, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totals = logs.reduce((acc, log) => {
        acc.calories += (log.calories || 0);
        acc.protein += (log.protein || 0);
        acc.carbs += (log.carbs || 0);
        acc.fat += (log.fat || 0);
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const handleLogFood = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user.id || !supabase) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('nutrition_logs')
                .insert({
                    user_id: session.user.id,
                    food_name: foodName,
                    meal_category: mealCategory,
                    calories: parseInt(formCalories) || 0,
                    protein: parseFloat(formProtein) || 0,
                    carbs: parseFloat(formCarbs) || 0,
                    fat: parseFloat(formFat) || 0
                });

            if (error) throw error;

            toast.success('Food logged successfully');
            setIsDialogOpen(false);
            // Reset form
            setFoodName('');
            setFormCalories('');
            setFormProtein('');
            setFormCarbs('');
            setFormFat('');
            
            fetchData();
        } catch (error: any) {
            toast.error('Failed to log food', { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from('nutrition_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setLogs(logs.filter(l => l.id !== id));
            toast.success('Log deleted');
        } catch (error: any) {
            toast.error('Delete failed');
        }
    };

    if (loading) return (
        <Card className="border-none shadow-sm h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
    );

    const calPercent = Math.min(100, Math.round((totals.calories / targets.calories) * 100));

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Utensils className="h-4 w-4" /> Nutrition
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 border-dashed">
                                <Plus className="mr-1 h-3 w-3" /> Log Fuel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Log Food Entry</DialogTitle>
                                <DialogDescription>Enter the details of what you've consumed.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleLogFood} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Food Name</Label>
                                    <Input 
                                        placeholder="e.g., Chicken & Rice Bowl" 
                                        value={foodName}
                                        onChange={(e) => setFoodName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Meal Category</Label>
                                        <Select value={mealCategory} onValueChange={setMealCategory}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-zinc-950 border shadow-md">
                                                <SelectItem value="Breakfast">Breakfast</SelectItem>
                                                <SelectItem value="Lunch">Lunch</SelectItem>
                                                <SelectItem value="Dinner">Dinner</SelectItem>
                                                <SelectItem value="Snack">Snack</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Calories (kcal)</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="0" 
                                            value={formCalories}
                                            onChange={(e) => setFormCalories(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Protein (g)</Label>
                                        <Input type="number" placeholder="0" value={formProtein} onChange={(e) => setFormProtein(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Carbs (g)</Label>
                                        <Input type="number" placeholder="0" value={formCarbs} onChange={(e) => setFormCarbs(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fat (g)</Label>
                                        <Input type="number" placeholder="0" value={formFat} onChange={(e) => setFormFat(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Logging...' : 'Confirm Entry'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>Daily intake vs targets</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
                {/* Calories Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-bold">Calories</span>
                        <span className="text-muted-foreground">{totals.calories} / {targets.calories} kcal</span>
                    </div>
                    <Progress value={calPercent} className="h-2" />
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            <span>Protein</span>
                            <span>{Math.round(totals.protein)}g</span>
                        </div>
                        <Progress value={Math.min(100, (totals.protein / targets.protein) * 100)} className="h-1 bg-blue-500/10" indicatorClassName="bg-blue-500" />
                        <p className="text-[9px] text-center text-muted-foreground">{targets.protein}g Target</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            <span>Carbs</span>
                            <span>{Math.round(totals.carbs)}g</span>
                        </div>
                        <Progress value={Math.min(100, (totals.carbs / targets.carbs) * 100)} className="h-1 bg-green-500/10" indicatorClassName="bg-green-500" />
                        <p className="text-[9px] text-center text-muted-foreground">{targets.carbs}g Target</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            <span>Fat</span>
                            <span>{Math.round(totals.fat)}g</span>
                        </div>
                        <Progress value={Math.min(100, (totals.fat / targets.fat) * 100)} className="h-1 bg-yellow-500/10" indicatorClassName="bg-yellow-500" />
                        <p className="text-[9px] text-center text-muted-foreground">{targets.fat}g Target</p>
                    </div>
                </div>

                {/* Today's Log List */}
                <div className="pt-4 border-t">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                        Today's Fuel
                    </h4>
                    {logs.length === 0 ? (
                        <div className="text-center py-4 bg-muted/20 rounded-lg border border-dashed">
                             <p className="text-[10px] text-muted-foreground italic">No fuel logged today.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-2 rounded bg-muted/30 group hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="text-xs font-bold">{log.food_name}</p>
                                        <p className="text-[9px] text-muted-foreground uppercase">{log.meal_category} • {log.calories} kcal</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                        onClick={() => handleDeleteLog(log.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {!profileData?.daily_calorie_target && (
                    <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                            Using default targets. 
                            <Link href="/profile" className="ml-1 text-primary font-bold hover:underline">
                                Personalize your nutrition profile
                            </Link> 
                            for more accurate tracking.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
