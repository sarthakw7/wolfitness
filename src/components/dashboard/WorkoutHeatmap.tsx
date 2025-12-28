'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorkoutHeatmapProps {
  logs: { date: string; volume: number }[];
  todayStr?: string; // YYYY-MM-DD
}

export function WorkoutHeatmap({ logs, todayStr }: WorkoutHeatmapProps) {
  // Use passed date to ensure server/client consistency
  const referenceDate = todayStr ? new Date(todayStr) : new Date();
  
  // Generate the last 90 days (approx 13 weeks)
  const weeks = [];
  
  // Normalize logs lookup
  const logMap = new Map(logs.map(l => [l.date, l.volume]));

  // Start from 12 weeks ago, aligning to Sunday/Monday
  const startDate = new Date(referenceDate);
  startDate.setDate(referenceDate.getDate() - 84); // 12 weeks * 7
  // Adjust to previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let w = 0; w < 13; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + (w * 7) + d);
          
          const dateStr = date.toISOString().split('T')[0];
          const volume = logMap.get(dateStr) || 0;
          
          // Determine intensity
          let intensityClass = 'bg-muted'; // 0
          if (volume > 0) intensityClass = 'bg-green-200 dark:bg-green-900';
          if (volume > 5000) intensityClass = 'bg-green-400 dark:bg-green-700';
          if (volume > 10000) intensityClass = 'bg-green-600 dark:bg-green-500';

          // Simple string comparison for future check to avoid time/timezone issues
          // referenceDate is 'YYYY-MM-DDT00:00:00...' effectively
          const isFuture = date > referenceDate;

          days.push({
              date: dateStr,
              volume,
              className: intensityClass,
              isFuture
          });
      }
      weeks.push(days);
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1">
                {week.map((day, dIdx) => (
                    <TooltipProvider key={day.date}>
                        <Tooltip>
                            <TooltipTrigger>
                                <div 
                                    className={cn(
                                        "h-3 w-3 rounded-sm transition-colors", 
                                        day.className,
                                        day.isFuture && "opacity-0"
                                    )} 
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs font-bold">{day.date}</p>
                                <p className="text-xs">{day.volume > 0 ? `${(day.volume / 1000).toFixed(1)}k kg` : 'No workout'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        ))}
    </div>
  );
}