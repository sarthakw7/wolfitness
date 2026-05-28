'use client';

import * as React from 'react';
import { Grip, Dumbbell, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function AppSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Grip className="h-5 w-5" />
          <span className="sr-only">Toggle platform apps</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border-border/40 shadow-2xl p-2 rounded-2xl z-[100]">
        <DropdownMenuLabel className="text-xs font-black tracking-widest text-muted-foreground uppercase px-2 py-1.5">
          Platform
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <div className="grid grid-cols-1 gap-2 mt-2">
          <p className="text-[10px] text-muted-foreground italic px-2">No other apps connected.</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
