import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    logStep("ERROR", { message: "STRIPE_SECRET_KEY is not set" });
    return new Response(JSON.stringify({ error: "Stripe key not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Processing without signature verification (no webhook secret configured)");
    }

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { 
        sessionId: session.id, 
        customerEmail: session.customer_email,
        clientReferenceId: session.client_reference_id 
      });

      const userId = session.client_reference_id;
      const customerEmail = session.customer_email || session.customer_details?.email;

      if (userId) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ is_pro_user: true })
          .eq('id', userId);

        if (updateError) {
          logStep("Error updating profile by user ID", { error: updateError.message });
          
          if (customerEmail) {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
            if (!userError && userData.users) {
              const user = userData.users.find(u => u.email === customerEmail);
              if (user) {
                await supabaseAdmin
                  .from('profiles')
                  .update({ is_pro_user: true })
                  .eq('id', user.id);
                logStep("Profile updated via email lookup", { userId: user.id });
              }
            }
          }
        } else {
          logStep("Profile updated successfully", { userId });
        }
      } else if (customerEmail) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (!userError && userData.users) {
          const user = userData.users.find(u => u.email === customerEmail);
          if (user) {
            await supabaseAdmin
              .from('profiles')
              .update({ is_pro_user: true })
              .eq('id', user.id);
            logStep("Profile updated via email", { userId: user.id, email: customerEmail });
          } else {
            logStep("User not found by email", { email: customerEmail });
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription event", { 
        subscriptionId: subscription.id, 
        status: subscription.status 
      });

      if (subscription.status !== "active" && subscription.status !== "trialing") {
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        
        if (customer.email) {
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          if (userData?.users) {
            const user = userData.users.find(u => u.email === customer.email);
            if (user) {
              await supabaseAdmin
                .from('profiles')
                .update({ is_pro_user: false })
                .eq('id', user.id);
              logStep("Pro status revoked", { userId: user.id, email: customer.email });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
