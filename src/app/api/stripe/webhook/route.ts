import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    const success = await fulfillOrder(session);
    if (!success) {
        return new NextResponse('Error enrolling user', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const programId = session.metadata?.program_id;

    if (!userId || !programId) {
        console.error('Missing metadata in Stripe Session');
        return false;
    }

    // Idempotency Check: Check if already enrolled to avoid duplicates/errors
    const { data: existing } = await (supabaseAdmin as any)
        .from('wff_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .single();

    if (existing) {
        console.log('User already enrolled, skipping.');
        return true;
    }

    // Insert Enrollment
    const { error } = await (supabaseAdmin as any)
        .from('wff_enrollments')
        .insert({
            user_id: userId,
            program_id: programId,
            status: 'active'
        });

    if (error) {
        console.error('Supabase Enrollment Error:', error);
        return false;
    }
    
    console.log(`Successfully enrolled user ${userId} in program ${programId}`);

    // --- EXECUTE THE MENTOR ROYALTY SPLIT ---
    // The main coach was already paid via `transfer_data` in the checkout session.
    // Here we transfer the remaining 10% royalty to the Mentor.
    if (session.metadata?.is_franchise_sale === 'true' && session.metadata?.mentor_stripe_id) {
        try {
            await stripe.transfers.create({
                amount: parseInt(session.metadata.mentor_share_cents),
                currency: 'usd',
                destination: session.metadata.mentor_stripe_id,
                description: `Royalty for Master Template (Program ${programId})`,
            });
            console.log(`Successfully transferred mentor royalty to ${session.metadata.mentor_stripe_id}`);
        } catch (transferError) {
            console.error('Failed to transfer Mentor Royalty:', transferError);
            // We don't return false here because the consumer still bought the program and should get access.
            // In a real app, you'd log this to an admin alert table to retry the transfer later.
        }
    }

    return true;
}
