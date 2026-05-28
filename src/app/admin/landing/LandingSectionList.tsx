'use client';

import { useState } from 'react';
import { 
  GripVertical, 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection } from '@/services/admin';

export function LandingSectionList({ initialSections }: { initialSections: LandingSection[] }) {
  const [sections, setSections] = useState(initialSections);

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border p-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
            No sections found. Start by adding one.
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card divide-y divide-border">
          {sections.map((section) => (
            <div 
              key={section.id} 
              className="group flex items-center gap-6 p-6 hover:bg-secondary/30 transition-all"
            >
              {/* Drag Handle */}
              <button className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Status Indicator */}
              <div className={`h-2 w-2 rounded-none ${section.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-muted-foreground/30'}`} />

              {/* Section Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-foreground text-background">
                    {section.type}
                  </span>
                  <h4 className="text-sm font-black uppercase tracking-tight font-display">
                    {section.title?.replace(/\n/g, ' ') || 'Untitled Section'}
                  </h4>
                </div>
                {section.subtitle && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                    {section.subtitle}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-foreground hover:text-background">
                  {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-foreground hover:text-background">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-8 bg-border mx-2" />
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-foreground hover:text-background">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pt-4 italic">
        * Drag to reorder sections. Changes reflect on the live site after saving.
      </p>
    </div>
  );
}
