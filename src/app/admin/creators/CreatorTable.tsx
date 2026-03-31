'use client';

import { useState, useTransition } from 'react';
import { setCreatorVerification } from '@/services/admin';
import { 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Mail,
  Instagram,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Creator {
  id: string;
  is_verified: boolean | null;
  specialization?: string[] | null;
  headline?: string | null;
  profiles: {
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url?: string | null;
  } | null;
}

export function CreatorTable({ initialCreators }: { initialCreators: Creator[] }) {
  const [creators, setCreators] = useState(initialCreators);
  const [isPending, startTransition] = useTransition();

  const handleToggleVerification = async (creatorId: string, currentStatus: boolean | null) => {
    startTransition(async () => {
      try {
        const nextStatus = !currentStatus;
        await setCreatorVerification(creatorId, nextStatus);
        setCreators(prev => prev.map(c => 
          c.id === creatorId ? { ...c, is_verified: nextStatus } : c
        ));
        toast.success(
          nextStatus ? 'Coach verified.' : 'Verification revoked.',
          { description: 'Changes applied to the ecosystem.' }
        );
      } catch (error: any) {
        toast.error('Failed to update status', { description: error.message });
      }
    });
  };

  return (
    <div className="border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Specialization</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {creators.map((creator) => (
              <tr key={creator.id} className="hover:bg-secondary/20 transition-all group">
                {/* Identity */}
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-secondary border border-border overflow-hidden rounded-none shrink-0">
                      {creator.profiles?.avatar_url ? (
                        <img src={creator.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase opacity-20">
                          {creator.profiles?.username?.slice(0, 2) || '??'}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black uppercase tracking-tight font-display flex items-center gap-2">
                        {creator.profiles?.full_name || creator.profiles?.username || 'Unknown'}
                        {!!creator.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {creator.profiles?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Specialization */}
                <td className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {creator.specialization?.length ? (
                      creator.specialization.map(s => (
                        <span key={s} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-border bg-secondary/50">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-50">Generalist</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="p-6">
                  <div className={`
                    inline-flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em]
                    ${!!creator.is_verified 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }
                  `}>
                    {!!creator.is_verified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    {!!creator.is_verified ? 'Verified' : 'Pending'}
                  </div>
                </td>

                {/* Actions */}
                <td className="p-6">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 rounded-none text-[10px] font-black uppercase tracking-[0.1em] border-2"
                      onClick={() => handleToggleVerification(creator.id, creator.is_verified)}
                      disabled={isPending}
                    >
                      {!!creator.is_verified ? 'Revoke' : 'Verify'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creators.length === 0 && (
        <div className="p-20 text-center space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
            No creators registered in the network.
          </p>
        </div>
      )}
    </div>
  );
}
