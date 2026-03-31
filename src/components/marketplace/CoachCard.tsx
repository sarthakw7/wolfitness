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
  specialization: string[];
  yearsExperience: string;
  rating?: number;
  role?: string | null;
  endorsedByMentorId?: string | null;
}

export function CoachCard({ 
  id, 
  fullName, 
  username, 
  avatarUrl, 
  headline, 
  specialization,
  yearsExperience,
  rating,
  role,
  endorsedByMentorId
}: CoachCardProps) {
  const isMentor = role === 'mentor';
  const isEndorsed = !!endorsedByMentorId;

  return (
    <Card className={cn(
        "overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col h-full",
        isMentor ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20" : 
        isEndorsed ? "border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)] ring-1 ring-blue-500/10" : "border-muted"
    )}>
      <CardHeader className="p-0">
        <div className={cn(
            "h-24 relative",
            isMentor ? "bg-zinc-900" : 
            isEndorsed ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20" : "bg-gradient-to-r from-primary/10 to-purple-500/10"
        )}>
            {isMentor ? (
                <div className="absolute top-3 right-4">
                    <Badge className="bg-emerald-500 text-black font-black text-[10px] tracking-widest uppercase border-none hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        <Zap className="w-3 h-3 mr-1 fill-black" />
                        Signal Elite
                    </Badge>
                </div>
            ) : isEndorsed ? (
                <div className="absolute top-3 right-4">
                    <Badge className="bg-blue-600 text-white font-black text-[10px] tracking-widest uppercase border-none hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Mentor Endorsed
                    </Badge>
                </div>
            ) : null}
            <div className="absolute -bottom-10 left-6">
                <Avatar className={cn(
                    "h-20 w-20 border-4 shadow-sm",
                    isMentor ? "border-zinc-900" : "border-background"
                )}>
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
            {specialization.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="outline" className="capitalize">
                    {spec.replace('_', ' ')}
                </Badge>
            ))}
            {specialization.length > 3 && (
                <Badge variant="outline">+{specialization.length - 3}</Badge>
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
