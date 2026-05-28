import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectStripeButton } from './ConnectStripeButton';
import { stripe } from '@/lib/stripe';
import { Wallet, ArrowUpRight, CheckCircle2, Dumbbell } from 'lucide-react';

export const revalidate = 0;

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const params = await searchParams;

  if (!session) redirect('/auth/login');

  // Verify they are allowed here
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userProfile?.role !== 'coach') {
    redirect('/dashboard');
  }

  // Get Creator data
  const { data: creator } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // If the creator record doesn't exist at all, they MUST onboarding
  if (!creator) {
    redirect('/onboarding/coach');
  }

  const isVerified = creator.is_verified || false;

  // Check actual Stripe status
  let isConnected = creator.stripe_onboarding_complete || false;
  
  if (creator.stripe_account_id && !isConnected) {
    try {
      const account = await stripe.accounts.retrieve(creator.stripe_account_id);
      
      const hasDetails = account.details_submitted;
      const canTransfer = account.capabilities?.transfers === 'active';
      const isComplete = hasDetails && canTransfer;
      
      if (isComplete !== creator.stripe_onboarding_complete) {
        await supabase
          .from('coaches')
          .update({ stripe_onboarding_complete: isComplete })
          .eq('id', session.user.id);
        isConnected = isComplete;
      }
    } catch (e) {
      console.error('Error fetching Stripe status', e);
    }
  }

  // 1. Fetch paid purchase ledger entries for this coach
  const { data: paidPurchases } = await (supabase as any)
    .from('purchases')
    .select(`
      id,
      amount,
      coach_amount,
      currency,
      created_at,
      paid_at,
      programs!inner (
        title,
        creator_id
      )
    `)
    .eq('programs.creator_id', session.user.id)
    .eq('status', 'paid');

  // Calculate Totals
  let directRevenue = 0;

  (paidPurchases || []).forEach((purchase: any) => {
    const coachAmount = Number(purchase.coach_amount ?? 0);
    const fallbackCoachAmount = Math.round(Number(purchase.amount ?? 0) * 0.9);
    directRevenue += (coachAmount || fallbackCoachAmount) / 100;
  });

  const totalRevenue = directRevenue;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Coach Wallet</h1>
            <p className="text-muted-foreground mt-1">Manage your earnings from Wolfitness programs.</p>
          </div>
        </div>

        {params.stripe === 'success' && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium text-sm">Stripe account connected successfully! You are now ready to receive payouts.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Earnings Panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="shadow-sm border-none bg-zinc-950 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Wallet className="w-32 h-32" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-zinc-400">Lifetime Earnings</CardDescription>
                  <CardTitle className="text-5xl font-black">${totalRevenue.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <ArrowUpRight className="w-3 h-3" /> Payouts Enabled
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card className="shadow-sm border-none bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Revenue Streams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500" />
                         <span className="text-sm font-medium">Program Sales (90%)</span>
                      </div>
                      <span className="text-sm font-bold">${directRevenue.toFixed(2)}</span>
                   </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Connect your bank account to start earning from your programs.
                  </div>
                ) : (
                  <div className="space-y-4">
                     {(paidPurchases || [])
                        .sort((a: any, b: any) => new Date(b.paid_at ?? b.created_at).getTime() - new Date(a.paid_at ?? a.created_at).getTime())
                        .slice(0, 5)
                        .map((t: any) => (
                           <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                                    <Dumbbell className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold">{t.programs?.title}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(t.paid_at ?? t.created_at).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className="text-sm font-black">
                                 +${((Number(t.coach_amount ?? 0) || Math.round(Number(t.amount ?? 0) * 0.9)) / 100).toFixed(2)}
                              </span>
                           </div>
                        ))}
                     {(!paidPurchases?.length) && (
                        <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
                          No recent transactions found. Share your programs to get started!
                        </div>
                     )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payout Settings</CardTitle>
                <CardDescription>Manage how you get paid</CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectStripeButton 
                  isConnected={isConnected} 
                  stripeAccountId={creator?.stripe_account_id} 
                  isVerified={isVerified}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <ArrowUpRight className="w-4 h-4" /> Platform Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>When you sell a program, you keep <strong>90%</strong> of the revenue.</p>
                <p>The remaining 10% covers transaction fees and platform maintenance.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
