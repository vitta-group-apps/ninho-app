// supabase/functions/handle-stripe-webhook/index.ts

import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  try {
    logStep('Webhook received');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');

    const body = await req.text();
    const sig  = req.headers.get('stripe-signature') ?? '';

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logStep('Invalid webhook signature', { error: errMsg });
      return new Response('Invalid signature', { status: 400 });
    }

    logStep('Event validated', { type: event.type, id: event.id });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    async function upsertSubscription(sub: Stripe.Subscription) {
      const familyId = sub.metadata?.family_id;
      if (!familyId) {
        logStep('No family_id in subscription metadata, skipping', { subscriptionId: sub.id });
        return;
      }

      const record = {
        family_id:                familyId,
        provider:                 'stripe',
        provider_subscription_id: sub.id,
        status:                   sub.status,
        current_period_start:     new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:       new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at_period_end:     sub.cancel_at_period_end,
        updated_at:               new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('subscriptions')
        .upsert(record, { onConflict: 'provider_subscription_id' });

      if (error) {
        logStep('Error upserting subscription', { error: error.message, subscriptionId: sub.id });
        throw new Error(`Failed to upsert subscription: ${error.message}`);
      }

      logStep('Subscription upserted', { familyId, subscriptionId: sub.id, status: sub.status });
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        logStep('Unhandled event type, ignoring', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in handle-stripe-webhook', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
