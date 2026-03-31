import { getLandingSections } from '@/services/admin';
import { LandingSectionList } from './LandingSectionList';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminLandingPage() {
  const sections = await getLandingSections();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
            CMS Engine
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase font-display">
            Landing Page
          </h1>
        </div>
        <Button className="h-12 px-8 text-[11px] font-black uppercase tracking-[0.2em] rounded-none">
          <Plus className="mr-2 h-4 w-4" /> Add Section
        </Button>
      </div>

      {/* Section List */}
      <LandingSectionList initialSections={sections} />
    </div>
  );
}
