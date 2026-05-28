import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

function logPurchase(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  console[level]('[purchase]', message, context ?? {});
}

function logPurchaseAudit(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  console[level]('[purchase-audit]', message, context ?? {});
}

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const success = await handleCheckoutCompleted(session);
        if (!success) return new NextResponse('Error enrolling user', { status: 500 });
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await markPurchaseCancelled(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        await markPurchaseFailedByIntent(intent);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await markPurchaseRefundedByCharge(charge);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    logPurchase('error', 'Stripe webhook handling failed.', {
      error: error instanceof Error ? error.message : String(error),
      eventType: event.type,
    });
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const admin = supabaseAdmin as any;
    const purchaseId = session.metadata?.purchase_id ?? null;
    const userId = session.metadata?.user_id;
    const programId = session.metadata?.program_id;

    if (!userId || !programId) {
        logPurchase('error', 'Missing user/program metadata in checkout session.', {
          checkoutSessionId: session.id,
          purchaseId,
        });
        return false;
    }

    if (session.payment_status !== 'paid') {
        await markPurchaseFailed(session, 'checkout_session_not_paid');
        return true;
    }

    let resolvedPurchaseId = purchaseId;
    if (!resolvedPurchaseId) {
      const { data: fallbackPurchase } = await admin
        .from('purchases')
        .select('id,status')
        .eq('stripe_checkout_session_id', session.id)
        .maybeSingle();
      resolvedPurchaseId = fallbackPurchase?.id ?? null;
    }

    if (!resolvedPurchaseId) {
      logPurchase('error', 'Unable to resolve purchase for completed checkout session.', {
        checkoutSessionId: session.id,
        programId,
        userId,
      });
      return false;
    }

    const currentStatus = await markPurchasePaid(session, resolvedPurchaseId);
    if (!currentStatus) {
      return false;
    }

    if (currentStatus === 'paid') {
      logPurchase('info', 'Purchase already marked paid, skipping duplicate fulfill.', {
        checkoutSessionId: session.id,
        purchaseId: resolvedPurchaseId,
      });
    }

    // Idempotency Check: Check if already enrolled to avoid duplicates/errors
    const { data: existing } = await admin
        .from('enrollments')
        .select('id,status')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .maybeSingle();

    if (existing?.status === 'active') {
        logPurchase('info', 'Enrollment already exists for paid purchase.', {
          programId,
          purchaseId: resolvedPurchaseId,
          userId,
        });
        return true;
    }

    if (existing) {
        const { error: updateError } = await admin
            .from('enrollments')
            .update({ status: 'active' })
            .eq('id', existing.id);

        if (updateError) {
            logPurchase('error', 'Enrollment reactivate failed after paid verification.', {
              error: updateError.message,
              previousStatus: existing.status,
              programId,
              purchaseId: resolvedPurchaseId,
              userId,
            });
            return false;
        }

        logPurchaseAudit('info', 'Enrollment reactivated from paid purchase.', {
          previousStatus: existing.status,
          programId,
          purchaseId: resolvedPurchaseId,
          userId,
        });
        return true;
    }

    // Insert Enrollment
    const { error } = await admin
        .from('enrollments')
        .insert({
            user_id: userId,
            program_id: programId,
            status: 'active'
        });

    if (error) {
        logPurchase('error', 'Enrollment insert failed after paid verification.', {
          error: error.message,
          programId,
          purchaseId: resolvedPurchaseId,
          userId,
        });
        return false;
    }

    logPurchase('info', 'Enrollment created from paid purchase.', {
      checkoutSessionId: session.id,
      programId,
      purchaseId: resolvedPurchaseId,
      userId,
    });

    return true;
}

async function markPurchasePaid(session: Stripe.Checkout.Session, purchaseId: string): Promise<'paid' | 'updated' | null> {
  const admin = supabaseAdmin as any;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null;
  let paymentMethod: string | null = null;
  let stripePriceId: string | null = null;
  let stripeProductId: string | null = null;

  if (paymentIntentId) {
    try {
      const charges = await stripe.charges.list({
        limit: 1,
        payment_intent: paymentIntentId,
      });
      paymentMethod = charges.data[0]?.payment_method_details?.type ?? null;
    } catch (error) {
      logPurchaseAudit('warn', 'Unable to resolve payment method for paid purchase.', {
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId,
        purchaseId,
      });
    }
  }

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
      limit: 1,
    });
    const price = lineItems.data[0]?.price;
    stripePriceId = price?.id ?? null;
    stripeProductId =
      typeof price?.product === 'string'
        ? price.product
        : price?.product?.id ?? null;
  } catch (error) {
    logPurchaseAudit('warn', 'Unable to resolve Stripe price/product for paid purchase.', {
      checkoutSessionId: session.id,
      error: error instanceof Error ? error.message : String(error),
      purchaseId,
    });
  }

  const { data: existingPurchase } = await admin
    .from('purchases')
    .select('id,status')
    .eq('id', purchaseId)
    .maybeSingle();

  if (!existingPurchase) {
    logPurchase('error', 'Purchase not found while marking paid.', {
      checkoutSessionId: session.id,
      purchaseId,
    });
    return null;
  }

  if (existingPurchase.status === 'paid') {
    return 'paid';
  }

  const { error } = await admin
    .from('purchases')
    .update({
      failure_reason: null,
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      payment_intent_id: paymentIntentId,
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: stripePriceId,
      stripe_product_id: stripeProductId,
    })
    .eq('id', purchaseId);

  if (error) {
    logPurchase('error', 'Failed to mark purchase paid.', {
      checkoutSessionId: session.id,
      error: error.message,
      purchaseId,
    });
    return null;
  }

  logPurchaseAudit('info', 'One-time purchase payment persisted.', {
    paymentIntentId,
    paymentMethod,
    purchaseId,
    stripeCustomerId,
  });

  return 'updated';
}

async function markPurchaseFailed(session: Stripe.Checkout.Session, reason: string) {
  const admin = supabaseAdmin as any;
  const purchaseId = session.metadata?.purchase_id ?? null;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!purchaseId) return;

  await admin
    .from('purchases')
    .update({
      failed_at: new Date().toISOString(),
      failure_reason: reason,
      payment_intent_id: paymentIntentId,
      status: 'failed',
      stripe_checkout_session_id: session.id,
    })
    .eq('id', purchaseId);

  logPurchase('warn', 'Purchase marked failed from checkout session.', {
    checkoutSessionId: session.id,
    purchaseId,
    reason,
  });
}

async function markPurchaseCancelled(session: Stripe.Checkout.Session) {
  const admin = supabaseAdmin as any;
  const purchaseId = session.metadata?.purchase_id ?? null;
  if (!purchaseId) return;

  await admin
    .from('purchases')
    .update({
      cancelled_at: new Date().toISOString(),
      status: 'cancelled',
      stripe_checkout_session_id: session.id,
    })
    .eq('id', purchaseId)
    .neq('status', 'paid');

  logPurchase('info', 'Purchase marked cancelled from expired checkout session.', {
    checkoutSessionId: session.id,
    purchaseId,
  });
}

async function markPurchaseFailedByIntent(intent: Stripe.PaymentIntent) {
  const admin = supabaseAdmin as any;
  const failureReason =
    intent.last_payment_error?.message ??
    intent.last_payment_error?.code ??
    'payment_intent_failed';

  await admin
    .from('purchases')
    .update({
      failed_at: new Date().toISOString(),
      failure_reason: failureReason,
      payment_intent_id: intent.id,
      status: 'failed',
    })
    .eq('payment_intent_id', intent.id)
    .neq('status', 'paid');

  logPurchase('warn', 'Purchase marked failed from payment intent failure.', {
    failureReason,
    paymentIntentId: intent.id,
  });
}

async function markPurchaseRefundedByCharge(charge: Stripe.Charge) {
  const admin = supabaseAdmin as any;
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!paymentIntentId) return;

  const { data: purchase } = await admin
    .from('purchases')
    .select('id,user_id,program_id')
    .eq('payment_intent_id', paymentIntentId)
    .eq('status', 'paid')
    .maybeSingle();

  const { error: purchaseError } = await admin
    .from('purchases')
    .update({
      refunded_at: new Date().toISOString(),
      refund_amount: charge.amount_refunded ?? charge.amount,
      status: 'refunded',
    })
    .eq('payment_intent_id', paymentIntentId)
    .eq('status', 'paid');

  if (purchaseError) {
    logPurchaseAudit('error', 'Failed to mark purchase refunded.', {
      error: purchaseError.message,
      paymentIntentId,
    });
    return;
  }

  if (purchase?.user_id && purchase?.program_id) {
    const { error: enrollmentError } = await admin
      .from('enrollments')
      .update({ status: 'refunded' })
      .eq('user_id', purchase.user_id)
      .eq('program_id', purchase.program_id);

    if (enrollmentError) {
      logPurchaseAudit('error', 'Refund processed but enrollment revoke failed.', {
        error: enrollmentError.message,
        paymentIntentId,
        programId: purchase.program_id,
        purchaseId: purchase.id,
        userId: purchase.user_id,
      });
      return;
    }
  }

  logPurchaseAudit('info', 'Refund policy applied: enrollment access revoked.', {
    paymentIntentId,
    programId: purchase?.program_id,
    purchaseId: purchase?.id,
    refundAmount: charge.amount_refunded ?? charge.amount,
    userId: purchase?.user_id,
  });

  logPurchase('info', 'Purchase marked refunded from charge.refunded event.', {
    chargeId: charge.id,
    paymentIntentId,
  });
}
