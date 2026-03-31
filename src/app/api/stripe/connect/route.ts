import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get or Create WFF Creator record
    let { data: creator, error: creatorError } = await supabase
      .from('wff_creators')
      .select('stripe_account_id, is_verified')
      .eq('id', session.user.id)
      .single();

    if (creatorError || !creator) {
       // If they aren't in the wff_creators table yet, they shouldn't be here
       return NextResponse.json({ message: 'Creator profile not found' }, { status: 404 });
    }

    if (!creator.is_verified) {
        return NextResponse.json({ message: 'Must be verified to set up payouts' }, { status: 403 });
    }

    let stripeAccountId = creator.stripe_account_id;

    // 2. Create Stripe Connect account if they don't have one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          userId: session.user.id,
          platform: 'wolfitness',
        }
      });

      stripeAccountId = account.id;

      // Save back to DB
      await supabase
        .from('wff_creators')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', session.user.id);
    }

    // 3. Generate Onboarding Link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/dashboard/coach/wallet`,
      return_url: `${appUrl}/dashboard/coach/wallet?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('[STRIPE_CONNECT_ERROR]', error);
    return NextResponse.json(
      { message: error.message || 'Internal Error' },
      { status: 500 }
    );
  }
}
