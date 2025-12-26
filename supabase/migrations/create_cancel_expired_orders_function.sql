-- Function to cancel expired pending orders
-- This should be called periodically (e.g., daily via cron job)

CREATE OR REPLACE FUNCTION cancel_expired_pending_orders()
RETURNS TABLE (
  cancelled_order_id uuid,
  cancelled_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.orders
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE 
    payment_status = 'pending_payment'
    AND created_at < (now() - interval '48 hours')
    AND status = 'pending'
  RETURNING id, updated_at;
END;
$$;

-- Grant execute permission to authenticated users (optional, adjust as needed)
-- GRANT EXECUTE ON FUNCTION cancel_expired_pending_orders() TO authenticated;

-- Create an index to speed up the query
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_created 
ON public.orders(payment_status, created_at, status)
WHERE payment_status = 'pending_payment' AND status = 'pending';

-- Comment to document the function
COMMENT ON FUNCTION cancel_expired_pending_orders() IS 'Cancels orders with pending_payment status that are older than 48 hours. Should be run daily via Supabase Edge Function with cron trigger.';
