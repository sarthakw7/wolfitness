'use client';

import { useState } from 'react';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Dumbbell, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Coach {
  id: string;
  specializations: string[];
  years_experience: string;
  headline: string;
  users: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    role: string | null;
  };
}

interface MarketplaceGridProps {
  initialCoaches: Coach[];
}

const categories = ["All", "Bodybuilding", "Yoga", "Crossfit", "Weight Loss", "Mobility", "Nutrition"];

export function MarketplaceGrid({ initialCoaches }: MarketplaceGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Filter logic
  const filteredCoaches = initialCoaches.filter((coach) => {
    const query = searchQuery.toLowerCase();
    const name = coach.users?.full_name?.toLowerCase() || '';
    const headline = coach.headline?.toLowerCase() || '';
    const specializations = coach.specializations?.map(s => s.toLowerCase()) || [];
    
    // Text Match
    const matchesSearch = name.includes(query) || headline.includes(query) || specializations.some(s => s.includes(query));
    
    // Category Match
    const matchesCategory = activeCategory === 'All' || specializations.some(s => s.includes(activeCategory.toLowerCase().replace(' ', '_')));

    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Immersive Search Hero */}
      <section className="relative bg-neutral-900 text-white py-20 overflow-hidden border-b border-white/10">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
            <div className="absolute -top-[50%] -left-[20%] w-[1000px] h-[1000px] rounded-full bg-violet-900/30 blur-3xl" />
            <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-3xl" />
        </div>

        <div className="container relative z-10 max-w-5xl mx-auto px-4 text-center">
            <Badge className="bg-white/10 text-white hover:bg-white/20 border-none mb-6 px-4 py-1.5 text-sm uppercase tracking-widest backdrop-blur-md">
                <Sparkles className="w-3 h-3 mr-2 text-yellow-400" />
                World Class Coaching
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-white leading-tight">
                Find Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Coach</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Connect with elite trainers, nutritionists, and wellness experts tailored to your specific goals and lifestyle.
            </p>

            <div className="max-w-2xl mx-auto flex gap-2 mb-10">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-white transition-colors" />
                    <Input 
                        placeholder="Search by name, goal, or keyword..." 
                        className="pl-12 h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:bg-white/10 focus-visible:border-white/20 transition-all rounded-xl shadow-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button size="lg" variant="outline" className="h-12 px-6 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {/* Quick Categories */}
            <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                            ${activeCategory === cat 
                                ? 'bg-white text-black border-white scale-105 shadow-lg shadow-white/10' 
                                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                            }
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
      </section>

      {/* Grid Section */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[500px]">
        
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-primary" />
                Available Coaches
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
                Showing {filteredCoaches.length} {filteredCoaches.length === 1 ? 'result' : 'results'}
            </p>
        </div>

        {filteredCoaches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCoaches.map((coach) => (
                    <div key={coach.id} className="transition-all duration-300 hover:-translate-y-1">
                        <CoachCard
                            id={coach.id}
                            fullName={coach.users?.full_name || 'Unknown Coach'}
                            username={coach.users?.username || 'coach'}
                            avatarUrl={coach.users?.avatar_url || undefined}
                            headline={coach.headline || 'Fitness Coach'}
                            specializations={coach.specializations || []}
                            yearsExperience={coach.years_experience || 'N/A'}
                        />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-32 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No coaches found</h3>
                <p className="text-muted-foreground mb-6">
                    We couldn't find any matches for "{searchQuery}" in {activeCategory}.
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                    Clear Filters
                </Button>
            </div>
        )}
      </main>
    </div>
  );
}