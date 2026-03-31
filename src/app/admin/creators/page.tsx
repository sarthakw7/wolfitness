import { getAllCreators } from '@/services/admin';
import { CreatorTable } from './CreatorTable';

export default async function AdminCreatorsPage() {
  const creators = await getAllCreators();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
          Network Management
        </span>
        <h1 className="text-4xl font-black tracking-tighter uppercase font-display">
          Elite Coaches
        </h1>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Manage and verify creators in the ecosystem.
        </p>
      </div>

      {/* Creator Table */}
      <CreatorTable initialCreators={creators} />
    </div>
  );
}
