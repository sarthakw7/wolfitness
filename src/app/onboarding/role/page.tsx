'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import { User, Dumbbell, ArrowRight, Check } from 'lucide-react';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'consumer' | 'coach' | null>(null);

  const handleContinue = async () => {
    if (!selectedRole || !supabase || !session) return;

    setIsLoading(true);
    try {
      // Update the user's profile with the selected role
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', session.user.id);

      if (error) throw error;

      // Redirect based on role
      if (selectedRole === 'coach') {
        router.push('/onboarding/coach'); // Go to coach onboarding wizard
      } else {
        router.push('/onboarding/assessment'); // Go to assessment for consumers
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('Failed to save role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Choose Your Path
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            How will you use the WFF Ecosystem?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Consumer / Athlete Option */}
          <div 
            onClick={() => setSelectedRole('consumer')}
            className={`relative group cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'consumer' 
                ? 'border-indigo-600 bg-white dark:bg-neutral-900 ring-2 ring-indigo-600 ring-opacity-50' 
                : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-800'
            }`}
          >
            <div className="absolute top-4 right-4">
              {selectedRole === 'consumer' && <div className="bg-indigo-600 text-white p-1 rounded-full"><Check size={16} /></div>}
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
                selectedRole === 'consumer' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
              }`}>
                <User size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Athlete</h3>
              <p className="text-gray-500 dark:text-gray-400">
                I want to find workouts, track my progress, and achieve my fitness goals.
              </p>
            </div>
          </div>

          {/* Coach / Creator Option */}
          <div 
            onClick={() => setSelectedRole('coach')}
            className={`relative group cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'coach' 
                ? 'border-indigo-600 bg-white dark:bg-neutral-900 ring-2 ring-indigo-600 ring-opacity-50' 
                : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-800'
            }`}
          >
             <div className="absolute top-4 right-4">
              {selectedRole === 'coach' && <div className="bg-indigo-600 text-white p-1 rounded-full"><Check size={16} /></div>}
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
                selectedRole === 'coach' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
              }`}>
                <Dumbbell size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coach</h3>
              <p className="text-gray-500 dark:text-gray-400">
                I want to create programs, train athletes, and monetize my expertise.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
          className={`mt-8 w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center mx-auto transition-all ${
            !selectedRole 
              ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-105'
          }`}
        >
          {isLoading ? 'Saving...' : 'Continue'}
          {!isLoading && <ArrowRight className="ml-2" />}
        </button>
      </div>
    </div>
  );
}
