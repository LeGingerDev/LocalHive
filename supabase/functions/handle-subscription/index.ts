// Get secret token from environment variable
const WEBHOOK_SECRET = `Bearer ${Deno.env.get('REVENUE_CAT_SECRET')}`;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Validate request
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || authHeader !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const webhookData = await req.json();
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));

    // Extract data from RevenueCat webhook structure
    const { event } = webhookData;
    const appUserId = event.app_user_id;
    const eventType = event.type;
    const expirationAtMs = event.expiration_at_ms;

    // Determine subscription status based on event type
    let subscriptionStatus = 'free';
    let expiresAt = null;

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
      case 'SUBSCRIPTION_EXTENDED':
        subscriptionStatus = 'pro';
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'CANCELLATION':
      case 'EXPIRATION':
        subscriptionStatus = 'free';
        expiresAt = null;
        break;
      
      case 'BILLING_ISSUE':
        // Keep current status but update expiration
        subscriptionStatus = 'pro'; // Assume they're still pro until we know otherwise
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'NON_RENEWING_PURCHASE':
        // One-time purchase - treat as pro for the duration
        subscriptionStatus = 'pro';
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'SUBSCRIPTION_PAUSED':
        // Keep current status but mark as paused
        subscriptionStatus = 'pro'; // Still pro, just paused
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'TRANSFER':
        // Keep current status - transfer doesn't change subscription level
        subscriptionStatus = 'pro'; // Assume pro for transfer
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'TEMPORARY_ENTITLEMENT_GRANT':
        // Temporary grant - treat as pro for the duration
        subscriptionStatus = 'pro';
        expiresAt = expirationAtMs ? new Date(expirationAtMs).toISOString() : null;
        break;
      
      case 'TEST':
        // For test events, use expiration time to determine status
        if (expirationAtMs && new Date(expirationAtMs) > new Date()) {
          subscriptionStatus = 'pro';
          expiresAt = new Date(expirationAtMs).toISOString();
        } else {
          subscriptionStatus = 'free';
          expiresAt = null;
        }
        break;
      
      case 'INVOICE_ISSUANCE':
      case 'REFUND_REVERSED':
      case 'VIRTUAL_CURRENCY_TRANSACTION':
        // These don't change subscription status, just log them
        console.log(`Event type ${eventType} received - no status change needed`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Event ${eventType} processed - no status change` 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      
      default:
        console.log('Unhandled event type:', eventType);
        return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }

    // Use direct fetch to update database (avoiding Supabase client stack issues)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${appUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        subscription_status: subscriptionStatus,
        subscription_expires_at: expiresAt,
        subscription_updated_at: new Date().toISOString(),
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Database update failed:', errorText);
      throw new Error(`Database update failed: ${errorText}`);
    }

    console.log('Successfully updated subscription for user:', appUserId, {
      status: subscriptionStatus,
      expiresAt,
      eventType,
    });

    // Real-time update will be triggered automatically by the profiles table change
    // No need for additional subscription_events insert

    return new Response(JSON.stringify({
      success: true,
      message: `Subscription updated to ${subscriptionStatus}`,
      userId: appUserId,
      status: subscriptionStatus,
      expiresAt,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response(JSON.stringify({
      error: err.message || 'Internal server error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 