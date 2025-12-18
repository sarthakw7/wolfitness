'use client';

import { useState } from 'react';
import { CoachCard } from '@/components/marketplace/CoachCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

interface Coach {
  id: string;
  specialization: string[];
  years_experience: string;
  headline: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface MarketplaceGridProps {
  initialCoaches: Coach[];
}

export function MarketplaceGrid({ initialCoaches }: MarketplaceGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter logic
  const filteredCoaches = initialCoaches.filter((coach) => {
    const query = searchQuery.toLowerCase();
    const name = coach.profiles?.full_name?.toLowerCase() || '';
    const headline = coach.headline?.toLowerCase() || '';
    const specializations = coach.specialization?.join(' ').toLowerCase() || '';
    
    return name.includes(query) || headline.includes(query) || specializations.includes(query);
  });

  return (
    <div>
      {/* Search Bar Section */}
      <section className="bg-muted/30 py-12 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Perfect Coach</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Browse elite trainers, nutritionists, and wellness experts to guide your journey.
            </p>

            <div className="max-w-2xl mx-auto flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, goal, or keyword..." 
                        className="pl-10 h-12 text-base bg-background shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button size="lg" variant="outline" className="h-12 px-6">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>
        </div>
      </section>

      {/* Grid Section */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCoaches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCoaches.map((coach) => (
                    <CoachCard
                        key={coach.id}
                        id={coach.id}
                        fullName={coach.profiles?.full_name || 'Unknown Coach'}
                        username={coach.profiles?.username || 'coach'}
                        avatarUrl={coach.profiles?.avatar_url || undefined}
                        headline={coach.headline || 'Fitness Coach'}
                        specialization={coach.specialization || []}
                        yearsExperience={coach.years_experience || 'N/A'}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">No coaches found matching "{searchQuery}".</p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                    Clear Search
                </Button>
            </div>
        )}
      </main>
    </div>
  );
}
