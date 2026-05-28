import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type AuthUser = {
  email: string | null;
  id: string;
};

type AuthResolution = {
  authSource: 'bearer' | 'cookie';
  user: AuthUser;
};

function logPurchase(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  console[level]('[purchase]', message, context ?? {});
}

function logPurchaseAudit(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  console[level]('[purchase-audit]', message, context ?? {});
}

function appendQuery(url: string, params: Record<string, string>) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${new URLSearchParams(params).toString()}`;
}

function isAllowedMobileReturnUrl(value: unknown) {
  return (
    typeof value === 'string' &&
    (value.startsWith('wolfitnessexpo://purchase/success') ||
      value.startsWith('wolfitness://purchase/success'))
  );
}

async function authenticateRequest(req: Request): Promise<AuthResolution | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) return null;

    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return null;

    return {
      authSource: 'bearer',
      user: { email: user.email ?? null, id: user.id },
    };
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  return {
    authSource: 'cookie',
    user: { email: session.user.email ?? null, id: session.user.id },
  };
}

async function resolveStripeCustomer(admin: any, user: AuthUser) {
  const { data: profile } = await admin
    .from('users')
    .select('email,stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  const existingCustomerId = profile?.stripe_customer_id as string | null | undefined;
  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch (error) {
      logPurchaseAudit('warn', 'Stored Stripe customer could not be retrieved; creating replacement.', {
        error: error instanceof Error ? error.message : String(error),
        stripeCustomerId: existingCustomerId,
        userId: user.id,
      });
    }
  }

  const customer = await stripe.customers.create({
    email: user.email ?? profile?.email ?? undefined,
    metadata: {
      user_id: user.id,
    },
  });

  await admin
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user.id);

  logPurchaseAudit('info', 'Stripe customer persisted for purchase flow.', {
    stripeCustomerId: customer.id,
    userId: user.id,
  });

  return customer.id;
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      logPurchase('warn', 'Purchase init unauthorized request.');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const programId = typeof body?.programId === 'string' ? body.programId : null;
    const mobileSuccessUrl = isAllowedMobileReturnUrl(body?.successUrl) ? body.successUrl : null;
    const mobileCancelUrl = isAllowedMobileReturnUrl(body?.cancelUrl) ? body.cancelUrl : mobileSuccessUrl;

    if (!programId) {
      return NextResponse.json({ message: 'Program ID is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const admin = supabaseAdmin as any;

    const { data: program, error: programError } = await admin
      .from('programs')
      .select('id,title,description,image_url,price,creator_id')
      .eq('id', programId)
      .maybeSingle();

    if (programError || !program) {
      return NextResponse.json({ message: 'Program not found' }, { status: 404 });
    }

    const { data: existingEnrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', auth.user.id)
      .eq('program_id', programId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({ message: 'Already enrolled' }, { status: 409 });
    }

    if (Number(program.price) === 0) {
      logPurchase('info', 'Free program purchase init resolved to free enroll route.', {
        programId,
        userId: auth.user.id,
      });
      return NextResponse.json({
        checkoutUrl: `${appUrl}/api/enroll/free?program_id=${programId}`,
        isFree: true,
        purchaseId: null,
      });
    }

    const nowMs = Date.now();
    const { data: pendingPurchase } = await admin
      .from('purchases')
      .select('id,created_at,stripe_checkout_session_id,status')
      .eq('user_id', auth.user.id)
      .eq('program_id', programId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingPurchase?.stripe_checkout_session_id) {
      const createdAtMs = new Date(pendingPurchase.created_at).getTime();
      if (Number.isFinite(createdAtMs) && nowMs - createdAtMs < 30 * 60 * 1000) {
        const session = await stripe.checkout.sessions.retrieve(pendingPurchase.stripe_checkout_session_id);
        if (session.url) {
          logPurchase('info', 'Reused pending checkout session for idempotency.', {
            purchaseId: pendingPurchase.id,
            sessionId: pendingPurchase.stripe_checkout_session_id,
            userId: auth.user.id,
          });
          return NextResponse.json({
            checkoutUrl: session.url,
            purchaseId: pendingPurchase.id,
          });
        }
      }
    }

    const amountCents = Math.round(Number(program.price) * 100);
    const currency = 'usd';
    const stripeCustomerId = await resolveStripeCustomer(admin, auth.user);

    const { data: purchase, error: purchaseError } = await admin
      .from('purchases')
      .insert({
        amount: amountCents,
        currency,
        program_id: programId,
        status: 'pending',
        stripe_customer_id: stripeCustomerId,
        user_id: auth.user.id,
      })
      .select('id')
      .single();

    if (purchaseError || !purchase?.id) {
      logPurchase('error', 'Failed to create pending purchase.', {
        error: purchaseError?.message,
        programId,
        userId: auth.user.id,
      });
      return NextResponse.json({ message: 'Unable to initialize purchase' }, { status: 500 });
    }

    const { data: creator } = await admin
      .from('coaches')
      .select('stripe_account_id')
      .eq('id', program.creator_id)
      .maybeSingle();

    const sessionOptions: any = {
      cancel_url: mobileCancelUrl
        ? appendQuery(mobileCancelUrl, {
            programId,
            status: 'cancelled',
          })
        : `${appUrl}/program/${programId}?canceled=true`,
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              description: program.description || 'Fitness Program',
              images: program.image_url ? [program.image_url] : undefined,
              name: program.title,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        program_id: programId,
        purchase_id: purchase.id,
        user_id: auth.user.id,
      },
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: mobileSuccessUrl
        ? appendQuery(mobileSuccessUrl, {
            programId,
            purchaseId: purchase.id,
            status: 'success',
          })
        : `${appUrl}/dashboard?success=true&purchase_id=${purchase.id}`,
    };

    const sellerStripeId = creator?.stripe_account_id as string | null | undefined;
    let isSellerActive = false;
    let coachShareCents = 0;
    let platformShareCents = amountCents;

    if (sellerStripeId) {
      try {
        const account = await stripe.accounts.retrieve(sellerStripeId);
        isSellerActive = account.details_submitted && account.capabilities?.transfers === 'active';
      } catch (error) {
        logPurchase('warn', 'Unable to validate coach Stripe account, holding funds on platform.', {
          error: error instanceof Error ? error.message : String(error),
          programId,
          sellerStripeId,
        });
      }
    }

    if (sellerStripeId && isSellerActive) {
      coachShareCents = Math.round(amountCents * 0.9);
      platformShareCents = Math.max(amountCents - coachShareCents, 0);
      sessionOptions.payment_intent_data = {
        transfer_data: {
          amount: coachShareCents,
          destination: sellerStripeId,
        },
      };
    } else {
      sessionOptions.metadata.funds_held_by_platform = 'true';
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionOptions, {
      idempotencyKey: `purchase-init-${purchase.id}`,
    });

    let stripePriceId: string | null = null;
    let stripeProductId: string | null = null;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(checkoutSession.id, {
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
      logPurchaseAudit('warn', 'Unable to persist generated Stripe price/product IDs.', {
        checkoutSessionId: checkoutSession.id,
        error: error instanceof Error ? error.message : String(error),
        purchaseId: purchase.id,
      });
    }

    await admin
      .from('purchases')
      .update({
        application_fee_amount: platformShareCents,
        coach_amount: coachShareCents,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_customer_id: stripeCustomerId,
        stripe_price_id: stripePriceId,
        stripe_product_id: stripeProductId,
      })
      .eq('id', purchase.id);

    logPurchaseAudit('info', 'One-time purchase ledger initialized.', {
      applicationFeeAmount: platformShareCents,
      coachAmount: coachShareCents,
      purchaseId: purchase.id,
      stripeCustomerId,
      stripePriceId,
      stripeProductId,
    });

    logPurchase('info', 'Purchase initialized.', {
      authSource: auth.authSource,
      checkoutSessionId: checkoutSession.id,
      programId,
      purchaseId: purchase.id,
      userId: auth.user.id,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      isFree: false,
      purchaseId: purchase.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    logPurchase('error', 'Purchase init failed.', {
      error: error?.message || String(error),
    });
    return NextResponse.json(
      {
        message: error?.message || 'Internal Error',
      },
      { status: 500 },
    );
  }
}
