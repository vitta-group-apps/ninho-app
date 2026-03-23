// supabase/functions/handle-stripe-webhook/index.ts

import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

Deno.serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Mapeia status Stripe → status Ninho
  async function upsertSubscription(sub: Stripe.Subscription) {
    const familyId = sub.metadata?.family_id;
    if (!familyId) return;

    await supabase.from('subscriptions').upsert({
      family_id:              familyId,
      provider:               'stripe',
      provider_subscription_id: sub.id,
      plan_id:                null, // preenche com lookup se quiser
      status:                 sub.status, // active | trialing | canceled | past_due
      current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
      cancel_at_period_end:   sub.cancel_at_period_end,
      updated_at:             new Date().toISOString(),
    }, { onConflict: 'provider_subscription_id' });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
