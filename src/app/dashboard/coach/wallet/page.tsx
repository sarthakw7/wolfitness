import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectStripeButton } from './ConnectStripeButton';
import { stripe } from '@/lib/stripe';
import { Wallet, ArrowUpRight, CheckCircle2, Zap, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach' && profile?.role !== 'mentor') {
    redirect('/dashboard');
  }

  // Get Creator data
  const { data: creator } = await supabase
    .from('wff_creators')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // If the creator record doesn't exist at all, they MUST onboarding
  if (!creator) {
    redirect('/onboarding/coach');
  }

  // NOTE: We no longer redirect if !creator.is_verified. 
  // We want them to see their empty wallet, but we will restrict Stripe actions.
  const isVerified = creator.is_verified || false;

  // Check actual Stripe status
  let isConnected = creator.stripe_onboarding_complete || false;
  
  if (creator.stripe_account_id && !isConnected) {
    try {
      const account = await stripe.accounts.retrieve(creator.stripe_account_id);
      
      const hasDetails = account.details_submitted;
      const canTransfer = account.capabilities?.transfers === 'active';
      const isComplete = hasDetails && canTransfer;
      
      console.log(`[STRIPE_STATUS_CHECK] Account: ${creator.stripe_account_id}`, {
          details_submitted: hasDetails,
          transfers_active: canTransfer,
          requirements: account.requirements?.currently_due
      });

      if (isComplete !== creator.stripe_onboarding_complete) {
        await supabase
          .from('wff_creators')
          .update({ stripe_onboarding_complete: isComplete })
          .eq('id', session.user.id);
        isConnected = isComplete;
      }
    } catch (e) {
      console.error('Error fetching Stripe status', e);
    }
  }

  // 1. Fetch WFF Program Sales (Direct 90% and Franchise 80%)
  const { data: wffEnrollments } = await (supabase as any)
    .from('wff_enrollments')
    .select(`
      id,
      created_at,
      wff_programs (
        title,
        price,
        creator_id,
        parent_template_id
      )
    `)
    .eq('wff_programs.creator_id', session.user.id);

  // 2. Fetch WFF Royalties (Mentor's 10% share from franchised programs)
  const { data: wffRoyalties } = await (supabase as any)
    .from('wff_enrollments')
    .select(`
      id,
      created_at,
      wff_programs (
        title,
        price,
        origin_mentor_id
      )
    `)
    .eq('wff_programs.origin_mentor_id', session.user.id);

  // 3. Fetch Signal Mentorship Revenue (Signal enrollments)
  const { data: signalEnrollments } = await (supabase as any)
    .from('enrollments')
    .select(`
      id,
      amount_paid_cents,
      enrolled_at,
      profiles:coach_id (full_name)
    `)
    .eq('mentor_id', session.user.id)
    .eq('status', 'active');

  // Calculate Totals
  let wffDirectRevenue = 0;
  let wffRoyaltyRevenue = 0;
  let signalRevenue = 0;

  (wffEnrollments || []).forEach((e: any) => {
    if (!e.wff_programs) return;
    const price = e.wff_programs.price || 0;
    // If it's a franchise (cloned), coach gets 80%, else 90%
    const share = e.wff_programs.parent_template_id ? 0.8 : 0.9;
    wffDirectRevenue += price * share;
  });

  (wffRoyalties || []).forEach((e: any) => {
    if (!e.wff_programs) return;
    const price = e.wff_programs.price || 0;
    wffRoyaltyRevenue += price * 0.1; // Mentor gets 10% royalty
  });

  (signalEnrollments || []).forEach((e: any) => {
    signalRevenue += (e.amount_paid_cents || 0) / 100;
  });

  const totalRevenue = wffDirectRevenue + wffRoyaltyRevenue + signalRevenue;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ecosystem Wallet</h1>
            <p className="text-muted-foreground mt-1">Consolidated revenue from Signal Mentorship and Wolfitness Marketplace.</p>
          </div>
          {profile?.role === 'mentor' && (
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-4 py-2 rounded-xl">
               <Zap className="w-4 h-4 mr-2 fill-emerald-600" /> Signal Elite Mentor
            </Badge>
          )}
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
                  <CardDescription className="text-zinc-400">Lifetime Ecosystem Volume</CardDescription>
                  <CardTitle className="text-5xl font-black">${totalRevenue.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <ArrowUpRight className="w-3 h-3" /> All Streams Active
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
                         <span className="text-sm font-medium">WFF Direct Sales</span>
                      </div>
                      <span className="text-sm font-bold">${wffDirectRevenue.toFixed(2)}</span>
                   </div>
                   {profile?.role === 'mentor' && (
                     <>
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm font-medium">Mentor Royalties</span>
                          </div>
                          <span className="text-sm font-bold">${wffRoyaltyRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-sm font-medium">Signal Subscriptions</span>
                          </div>
                          <span className="text-sm font-bold">${signalRevenue.toFixed(2)}</span>
                      </div>
                     </>
                   )}
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
                     {/* We can map real enrollments here for a mini ledger */}
                     {[...(wffEnrollments || []), ...(signalEnrollments || [])]
                        .sort((a: any, b: any) => new Date(b.created_at || b.enrolled_at).getTime() - new Date(a.created_at || a.enrolled_at).getTime())
                        .slice(0, 5)
                        .map((t: any) => (
                           <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-all">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.wff_programs ? 'bg-blue-500/10 text-blue-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                    {t.wff_programs ? <Dumbbell className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold">{t.wff_programs?.title || `Signal Mentorship: ${t.profiles?.full_name}`}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(t.created_at || t.enrolled_at).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className="text-sm font-black">
                                 +{t.wff_programs 
                                    ? `$${(t.wff_programs.price * (t.wff_programs.parent_template_id ? 0.8 : 0.9)).toFixed(2)}` 
                                    : `$${((t.amount_paid_cents || 0) / 100).toFixed(2)}`}
                              </span>
                           </div>
                        ))}
                     {(!wffEnrollments?.length && !signalEnrollments?.length) && (
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

            <Card className="shadow-sm bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <ArrowUpRight className="w-4 h-4" /> The 80/10/10 Split
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>When you sell a program you built from scratch, you keep <strong>90%</strong> of the revenue.</p>
                <p>If you clone and sell a Master Template created by an Elite Mentor, revenue is split automatically:</p>
                <ul className="list-disc pl-4 space-y-1 mt-2 text-foreground">
                  <li><strong>80%</strong> to You (The Coach)</li>
                  <li><strong>10%</strong> to Your Mentor (Royalty)</li>
                  <li><strong>10%</strong> to Platform</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
