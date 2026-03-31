import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { programId } = body;

    if (!programId) {
      return NextResponse.json({ message: 'Program ID is required' }, { status: 400 });
    }

    // 3. Fetch Program Details
    const { data: program, error: programError } = await supabase
      .from('wff_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }

    // 4. Fetch Creator's Stripe Info (Standard WFF Coach)
    const { data: creator } = await supabase
      .from('wff_creators')
      .select('stripe_account_id')
      .eq('id', program.creator_id)
      .maybeSingle();

    // 5. Fetch Mentor's Stripe Info (if this is a cloned franchise)
    let mentorStripeId = null;
    if (program.origin_mentor_id) {
       const { data: mentor } = await supabase
         .from('wff_creators') // Mentors are also in this table for WFF purposes
         .select('stripe_account_id')
         .eq('id', program.origin_mentor_id)
         .maybeSingle();
       mentorStripeId = mentor?.stripe_account_id;
    }

    // 6. Handle Free Programs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    if (program.price === 0) {
        return NextResponse.json({ url: `${appUrl}/api/enroll/free?program_id=${programId}` });
    }

    const unitAmount = Math.round(program.price * 100); // Convert to cents

    // 7. Build the Stripe Session Options
    let sessionOptions: any = {
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/program/${programId}?canceled=true`,
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: session.user.email,
      metadata: {
        user_id: session.user.id,
        program_id: programId,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: program.title,
              description: program.description || 'Fitness Program',
              images: program.image_url ? [program.image_url] : undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
    };

    // 8. THE 80/10/10 REVENUE SPLIT LOGIC
    const sellerStripeId = creator?.stripe_account_id;
    let isSellerActive = false;

    // Safety Check: Verify the seller account is actually ready for transfers
    if (sellerStripeId) {
      try {
        const account = await stripe.accounts.retrieve(sellerStripeId);
        isSellerActive = account.details_submitted && account.capabilities?.transfers === 'active';
      } catch (e) {
        console.warn(`Could not verify Stripe account ${sellerStripeId}, falling back to platform-held funds.`);
      }
    }

    // Only attempt split if the SELLER has an ACTIVE Stripe Account
    if (sellerStripeId && isSellerActive) {
      // Scenario B: The Franchise Sale (It has an origin mentor)
      if (program.origin_mentor_id && mentorStripeId) {
        const coachShareCents = Math.round(unitAmount * 0.80);
        
        sessionOptions.payment_intent_data = {
          transfer_data: {
            destination: sellerStripeId,
            amount: coachShareCents,
          },
        };

        sessionOptions.metadata.is_franchise_sale = 'true';
        sessionOptions.metadata.mentor_stripe_id = mentorStripeId;
        sessionOptions.metadata.mentor_share_cents = Math.round(unitAmount * 0.10).toString();

      } 
      // Scenario A: Direct Sale (No origin mentor)
      else {
        const coachShareCents = Math.round(unitAmount * 0.90);
        
        sessionOptions.payment_intent_data = {
          transfer_data: {
            destination: sellerStripeId,
            amount: coachShareCents,
          },
        };
      }
    } else {
      // No Stripe Account OR Account is Restricted.
      // Platform (WOLFITNESS) collects 100% and holds it.
      console.warn(`Program ${program.id} bought, but Creator ${program.creator_id} is not active. Funds held by platform.`);
      sessionOptions.metadata.funds_held_by_platform = 'true';
    }

    // 7. Execute Stripe Checkout
    const stripeSession = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: stripeSession.url });

  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR] Full Error:', error);
    return NextResponse.json(
      { 
        message: error.message || 'Internal Error',
        details: error.type || 'Unknown Stripe Error'
      },
      { status: 500 }
    );
  }
}
