'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type GlobalExercise = {
  id: string;
  name: string;
  primary_muscle: string | null;
  video_url: string | null;
};

interface ExercisePickerProps {
  value: string;
  onSelect: (exercise: GlobalExercise) => void;
  onChangeName: (name: string) => void;
  exercises: GlobalExercise[];
}

export function ExercisePicker({ value, onSelect, onChangeName, exercises }: ExercisePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? value : "Select exercise..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800" align="start">
        <Command className="bg-white dark:bg-zinc-950">
          <CommandInput 
            placeholder="Search exercise..." 
            onValueChange={(val) => {
                setInputValue(val);
                // Allow users to type custom names that aren't in the list
                // If they close the popover without selecting, we might want to capture this input?
                // Actually, for a robust UX, if they type something custom, they should click away or hit enter.
                // But the 'Command' component is restrictive. 
                // Let's stick to simple selection for now, 
                // but if they type something and it's not found, maybe offer to "Use 'XYZ'"?
            }}
          />
          <CommandList>
            <CommandEmpty>
                <div className="p-2 text-sm text-muted-foreground text-center">
                    No exercise found.
                    <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 ml-1"
                        onClick={() => {
                             onChangeName(inputValue); // Set the custom name
                             setOpen(false);
                        }}
                    >
                        Use &quot;{inputValue}&quot;
                    </Button>
                </div>
            </CommandEmpty>
            <CommandGroup heading="Library">
              {exercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.name}
                  onSelect={() => {
                    onSelect(exercise);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === exercise.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span>{exercise.name}</span>
                      {exercise.primary_muscle && (
                          <span className="text-xs text-muted-foreground">{exercise.primary_muscle}</span>
                      )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
