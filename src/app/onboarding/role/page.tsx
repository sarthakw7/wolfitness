'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { User, Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'coach' | null>(null);

  const handleContinue = async () => {
    if (!selectedRole || !supabase || !session) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', session.user.id);

      if (error) throw error;

      if (selectedRole === 'coach') {
        router.push('/onboarding/coach');
      } else {
        router.push('/onboarding/assessment');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('Failed to save role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'client' as const,
      icon: User,
      title: 'Athlete',
      subtitle: 'Train & Track',
      description: 'Find workouts, track progress, and execute your training.',
    },
    {
      id: 'coach' as const,
      icon: Dumbbell,
      title: 'Coach',
      subtitle: 'Build & Monetize',
      description: 'Create programs, train athletes, and scale your coaching business.',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl w-full space-y-16 text-center">
        {/* Header */}
        <div className="space-y-4">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
            Step 01 / Initialization
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase font-display">
            Choose Your<br />Path.
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            How will you operate within the platform?
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`
                relative group text-left p-8 border-2 transition-all duration-200
                ${selectedRole === role.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card hover:border-foreground/30'
                }
              `}
            >
              {/* Selection indicator */}
              <div className={`
                absolute top-4 right-4 h-5 w-5 border-2 flex items-center justify-center transition-all
                ${selectedRole === role.id
                  ? 'border-background bg-background'
                  : 'border-border'
                }
              `}>
                {selectedRole === role.id && (
                  <div className="h-2.5 w-2.5 bg-foreground" />
                )}
              </div>

              <div className="space-y-6">
                <role.icon className={`h-8 w-8 ${selectedRole === role.id ? 'text-background' : 'text-foreground'}`} />
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${selectedRole === role.id ? 'text-background/50' : 'text-muted-foreground'}`}>
                    {role.subtitle}
                  </span>
                  <h3 className="text-2xl font-black tracking-tighter uppercase font-display">
                    {role.title}
                  </h3>
                </div>
                <p className={`text-sm font-medium leading-relaxed ${selectedRole === role.id ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {role.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
          className="w-full md:w-auto h-14 px-16 text-[13px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
        >
          {isLoading ? 'Initializing...' : 'Continue'}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
