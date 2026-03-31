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
          <span className="sr-only">Toggle ecosystem apps</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border-border/40 shadow-2xl p-2 rounded-2xl z-[100]">
        <DropdownMenuLabel className="text-xs font-black tracking-widest text-muted-foreground uppercase px-2 py-1.5">
          Ecosystem
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <div className="grid grid-cols-1 gap-2 mt-2">
          <DropdownMenuItem asChild className="p-0 rounded-xl cursor-pointer">
            <a href="http://localhost:3000" className="flex items-center p-3 hover:bg-muted/50 rounded-xl transition-all w-full gap-4 group">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold tracking-widest uppercase">Signal</span>
                 <span className="text-[9px] text-muted-foreground font-medium">Switch to Authority</span>
              </div>
            </a>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
