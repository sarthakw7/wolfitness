'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Unlock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  programId: string;
  price: number;
  isEnrolled: boolean;
}

export function EnrollButton({ programId, price, isEnrolled }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/purchase/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });

      if (response.status === 401) {
        toast.error('Please login to enroll');
        return router.push(`/auth/login?returnTo=/program/${programId}`);
      }

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { checkoutUrl } = await response.json();
      if (!checkoutUrl) throw new Error('Checkout URL missing');
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (isEnrolled) {
      return (
        <Button 
            size="lg" 
            className="h-14 px-8 text-lg w-full sm:min-w-[240px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5"
            onClick={() => router.push('/dashboard')}
        >
            <PlayCircle className="mr-2 h-6 w-6" />
            Continue Training
        </Button>
      );
  }

  return (
    <Button 
        size="lg" 
        onClick={handleEnroll}
        disabled={loading}
        className="h-14 px-8 text-lg w-full sm:min-w-[240px] bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 font-bold"
    >
        {loading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        ) : (
            price === 0 ? (
                <>
                    <Unlock className="mr-2 h-6 w-6" />
                    Join for Free
                </>
            ) : (
                <>
                    Get Access Now
                </>
            )
        )}
    </Button>
  );
}
