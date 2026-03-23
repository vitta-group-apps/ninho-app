// supabase/functions/create-checkout/index.ts

import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PRICE_IDS = {
  monthly: 'price_1TE9S4EoS6pDYPW0GBbHsSfD',
  annual:  'price_1TE9SWEoS6pDYPW0FBL60N7d',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set');

    const { priceId, successUrl, cancelUrl } = await req.json();
    if (!priceId || !successUrl || !cancelUrl) {
      throw new Error('Missing required fields: priceId, successUrl, cancelUrl');
    }

    // Validate priceId is one of the known prices
    const knownPriceIds = Object.values(PRICE_IDS);
    if (!knownPriceIds.includes(priceId)) {
      throw new Error(`Invalid priceId: ${priceId}`);
    }

    logStep('Request parsed', { priceId });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error('User not authenticated');
    const user = userData.user;
    if (!user.email) throw new Error('User email not available');
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Get family_id from memberships
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error('No membership found for user');
    }
    logStep('Membership found', { familyId: membership.family_id });

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

    // Create or retrieve Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0] ?? await stripe.customers.create({
      email: user.email,
      metadata: { family_id: membership.family_id, user_id: user.id },
    });
    logStep('Stripe customer ready', { customerId: customer.id });

    // Create Checkout Session with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { family_id: membership.family_id },
        trial_period_days: 7,
      },
      locale: 'pt-BR',
    });

    logStep('Checkout session created', { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-checkout', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
