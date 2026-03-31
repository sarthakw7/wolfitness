'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Loader2, ExternalLink, DollarSign, Wallet, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectStripeButtonProps {
  isConnected: boolean;
  isVerified: boolean;
  stripeAccountId?: string | null;
}

export function ConnectStripeButton({ isConnected, isVerified, stripeAccountId }: ConnectStripeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!isVerified) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/connect', { method: 'POST' });
      
      let errorMessage = 'Something went wrong';
      let data: any = null;

      try {
        data = await response.json();
      } catch (e) {
        // Response was not JSON (e.g. plain text error from Next.js)
        errorMessage = await response.text();
      }

      if (!response.ok) {
        throw new Error(data?.message || errorMessage || 'Something went wrong');
      }

      // Redirect to Stripe Onboarding
      window.location.href = data.url;
    } catch (error: any) {
      toast.error('Failed to connect Stripe', {
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 p-4 rounded-xl border border-green-200 dark:border-green-500/20">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Payouts Active</p>
            <p className="text-xs opacity-80">Your bank account is connected.</p>
          </div>
        </div>
        <Button onClick={handleConnect} variant="outline" className="w-full gap-2">
          Manage Stripe Dashboard <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
          <div className="flex gap-2 text-amber-800 dark:text-amber-400 mb-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <h4 className="font-bold text-xs uppercase tracking-widest">Verification Pending</h4>
          </div>
          <p className="text-[10px] text-amber-700/70 dark:text-amber-400/60 font-medium leading-relaxed">
            Your profile is currently being reviewed by our team. You can still build programs, but you'll need verification before you can connect your bank account and receive payments.
          </p>
        </div>
        <Button disabled className="w-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 cursor-not-allowed">
            Payouts Locked
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-xl border border-border/50">
        <h4 className="font-semibold text-sm mb-1">Set up payouts</h4>
        <p className="text-xs text-muted-foreground mb-4">
          WFF uses Stripe to send money directly to your bank account safely and securely.
        </p>
        <Button 
          onClick={handleConnect} 
          disabled={isLoading} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {stripeAccountId ? 'Complete Stripe Setup' : 'Connect Bank Account'}
        </Button>
      </div>
    </div>
  );
}
