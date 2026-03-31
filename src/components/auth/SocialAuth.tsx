'use client';

import { createClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function SocialAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Use process.env.NEXT_PUBLIC_APP_URL if available to ensure we return to the correct app
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error('Authentication error', {
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
        )}
        Continue with Google
      </Button>
    </div>
  );
}
