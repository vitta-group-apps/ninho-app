// supabase/functions/create-checkout/index.ts

import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
});

Deno.serve(async (req) => {
  const { priceId, successUrl, cancelUrl } = await req.json();

  // Pega o user via JWT do Supabase
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Pega o family_id do usuário
  const { data: membership } = await supabase
    .from('memberships')
    .select('family_id')
    .eq('user_id', user.id)
    .single();

  // Cria ou recupera customer no Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0] ?? await stripe.customers.create({
    email: user.email,
    metadata: { family_id: membership?.family_id, user_id: user.id },
  });

  // Cria Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { family_id: membership?.family_id },
      trial_period_days: 7, // 7 dias grátis
    },
    locale: 'pt-BR',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});