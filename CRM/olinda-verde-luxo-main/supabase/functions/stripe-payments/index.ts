import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Stripe Payments - Gerencia pagamentos via Stripe
 * 
 * Endpoints:
 * - POST /create-payment-intent - Cria intenção de pagamento
 * - POST /create-subscription - Cria assinatura recorrente
 * - POST /webhook - Webhook do Stripe
 * - POST /cancel-subscription - Cancela assinatura
 * - GET /payment-methods - Lista métodos de pagamento do cliente
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/stripe-payments', '');

    // WEBHOOK - Não requer autenticação
    if (path === '/webhook' && req.method === 'POST') {
      const signature = req.headers.get('stripe-signature');
      if (!signature) {
        return new Response(
          JSON.stringify({ error: 'Assinatura do webhook ausente' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.text();
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Erro ao verificar webhook:', errorMessage);
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Processar eventos do webhook
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              paid_at: new Date().toISOString(),
              stripe_charge_id: paymentIntent.latest_charge as string
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          console.log(`✅ Payment ${paymentIntent.id} succeeded`);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              error_message: paymentIntent.last_payment_error?.message || 'Pagamento falhou'
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          console.log(`❌ Payment ${paymentIntent.id} failed`);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await supabase
            .from('payment_subscriptions')
            .upsert({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
            }, { onConflict: 'stripe_subscription_id' });

          console.log(`📅 Subscription ${subscription.id} ${event.type.split('.').pop()}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          await supabase
            .from('payment_subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          console.log(`🚫 Subscription ${subscription.id} cancelled`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return new Response(
        JSON.stringify({ received: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autenticação para demais endpoints
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE PAYMENT INTENT
    if (path === '/create-payment-intent' && req.method === 'POST') {
      const { amount, currency = 'brl', eventId, proposalId, leadId, metadata = {} } = await req.json();

      if (!amount) {
        return new Response(
          JSON.stringify({ error: 'Amount é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        metadata: {
          user_id: user.id,
          event_id: eventId || '',
          proposal_id: proposalId || '',
          ...metadata
        }
      });

      // Salvar transação no banco
      const { data: transaction, error: dbError } = await supabase
        .from('payment_transactions')
        .insert({
          event_id: eventId,
          proposal_id: proposalId,
          lead_id: leadId,
          payment_method: 'stripe',
          amount,
          currency,
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
          metadata
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erro ao salvar transação:', dbError);
      }

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          transactionId: transaction?.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE SUBSCRIPTION
    if (path === '/create-subscription' && req.method === 'POST') {
      const { leadId, planName, amount, interval = 'monthly', currency = 'brl' } = await req.json();

      if (!leadId || !planName || !amount) {
        return new Response(
          JSON.stringify({ error: 'leadId, planName e amount são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar ou criar cliente Stripe
      const { data: leadData } = await supabase
        .from('leads')
        .select('email, name')
        .eq('id', leadId)
        .single();

      let customerId: string;
      const { data: existingSub } = await supabase
        .from('payment_subscriptions')
        .select('stripe_customer_id')
        .eq('lead_id', leadId)
        .single();

      if (existingSub?.stripe_customer_id) {
        customerId = existingSub.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: leadData?.email || '',
          name: leadData?.name || '',
          metadata: { lead_id: leadId, user_id: user.id }
        });
        customerId = customer.id;
      }

      // Criar produto e preço
      const product = await stripe.products.create({
        name: planName
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency,
        recurring: {
          interval: interval === 'monthly' ? 'month' : interval === 'quarterly' ? 'month' : 'year',
          interval_count: interval === 'quarterly' ? 3 : 1
        }
      });

      // Criar assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        metadata: { lead_id: leadId, user_id: user.id }
      });

      // Salvar no banco
      await supabase
        .from('payment_subscriptions')
        .insert({
          lead_id: leadId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          plan_name: planName,
          amount,
          currency,
          interval,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        });

      return new Response(
        JSON.stringify({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice
            ? (await stripe.invoices.retrieve(subscription.latest_invoice as string)).payment_intent
            : null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CANCEL SUBSCRIPTION
    if (path === '/cancel-subscription' && req.method === 'POST') {
      const { subscriptionId } = await req.json();

      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ error: 'subscriptionId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const subscription = await stripe.subscriptions.cancel(subscriptionId);

      await supabase
        .from('payment_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      return new Response(
        JSON.stringify({ success: true, subscription }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in stripe-payments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
