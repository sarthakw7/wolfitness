'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCircle2, Star, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CoachCardProps {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  headline: string;
  specializations: string[];
  yearsExperience: string;
  rating?: number;
}

export function CoachCard({ 
  id, 
  fullName, 
  username, 
  avatarUrl, 
  headline, 
  specializations,
  yearsExperience,
  rating,
}: CoachCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col h-full border-muted">
      <CardHeader className="p-0">
        <div className="h-24 relative bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 border-4 shadow-sm border-background">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                        {fullName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-12 pb-4 px-6 flex-1">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg leading-none truncate">{fullName}</h3>
                <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
            {rating ? (
                <Badge variant="secondary" className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                    <Star className="h-3 w-3 fill-amber-700" />
                    {rating.toFixed(1)}
                </Badge>
            ) : (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] uppercase font-bold tracking-tighter">
                    Verified
                </Badge>
            )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
            {headline}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
            {specializations.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="outline" className="capitalize">
                    {spec.replace('_', ' ')}
                </Badge>
            ))}
            {specializations.length > 3 && (
                <Badge variant="outline">+{specializations.length - 3}</Badge>
            )}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>{yearsExperience} Exp</span>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Link href={`/coach/${id}`} className="w-full">
            <Button className="w-full rounded-full">View Profile</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
