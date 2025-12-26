import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key for elevated permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Call the function to cancel expired orders
    const { data, error } = await supabaseClient
      .rpc('cancel_expired_pending_orders')

    if (error) {
      console.error('Error cancelling expired orders:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    const cancelledCount = data?.length || 0
    console.log(`Successfully cancelled ${cancelledCount} expired orders`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        cancelled_count: cancelledCount,
        cancelled_orders: data 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* 
To deploy this Edge Function:

1. Install Supabase CLI if not already installed:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref your-project-ref

4. Deploy the function:
   supabase functions deploy cancel-expired-orders

5. Set up a cron job in Supabase Dashboard:
   - Go to Database > Cron Jobs
   - Or use pg_cron extension:
   
   SELECT cron.schedule(
     'cancel-expired-orders',
     '0 2 * * *', -- Run daily at 2 AM
     $$
     SELECT net.http_post(
       url := 'https://your-project-ref.supabase.co/functions/v1/cancel-expired-orders',
       headers := jsonb_build_object('Authorization', 'Bearer YOUR_ANON_KEY')
     ) AS request_id;
     $$
   );

6. Alternative: Use Supabase Cron Jobs UI:
   - Go to your Supabase project dashboard
   - Navigate to Database > Webhooks
   - Create a new cron job pointing to this Edge Function URL
   - Set schedule to run daily (e.g., "0 2 * * *" for 2 AM daily)
*/
