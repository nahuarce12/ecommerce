-- Add MercadoPago integration fields to orders table
-- Migration: add_mercadopago_integration.sql

-- Add MercadoPago-specific columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS mercadopago_preference_id text,
ADD COLUMN IF NOT EXISTS mercadopago_payment_id text,
ADD COLUMN IF NOT EXISTS mercadopago_merchant_order_id text;

-- Create index for webhook lookups by payment_id
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id 
ON public.orders(mercadopago_payment_id);

-- Create index for webhook lookups by merchant_order_id
CREATE INDEX IF NOT EXISTS idx_orders_mp_merchant_order_id 
ON public.orders(mercadopago_merchant_order_id);

-- Create index for preference_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference_id 
ON public.orders(mercadopago_preference_id);

-- Add comment to document MercadoPago fields
COMMENT ON COLUMN public.orders.mercadopago_preference_id IS 'MercadoPago preference ID for checkout redirect';
COMMENT ON COLUMN public.orders.mercadopago_payment_id IS 'MercadoPago payment ID received from webhook';
COMMENT ON COLUMN public.orders.mercadopago_merchant_order_id IS 'MercadoPago merchant order ID for reference';
