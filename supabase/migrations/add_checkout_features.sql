-- ⚠️ IMPORTANTE: Ejecuta este script en tu Supabase SQL Editor
-- Este script agrega las columnas y funciones necesarias para el checkout

-- 1. Agregar columnas a la tabla orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending_payment' CHECK (payment_status IN ('pending_payment', 'paid', 'failed')) NOT NULL,
  ADD COLUMN IF NOT EXISTS shipping_cost decimal(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

-- 1.1 Verificar que order_items tenga la columna product_name (requerida)
-- Si tu tabla no tiene esta columna, descomenta y ejecuta la siguiente línea:
-- ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name text NOT NULL DEFAULT 'Unknown Product';

-- 2. Función para decrementar stock
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id uuid, quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - quantity
  WHERE id = product_id
    AND stock >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para restaurar stock cuando se cancela una orden
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.products
    SET stock = products.stock + oi.quantity
    FROM public.order_items oi
    WHERE products.id = oi.product_id
      AND oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para restaurar stock automáticamente
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION public.restore_stock_on_cancel();

-- 5. Función para que admin cancele pedidos impagos después de 72 horas
CREATE OR REPLACE FUNCTION public.cancel_unpaid_orders()
RETURNS TABLE (cancelled_count bigint) AS $$
DECLARE
  count bigint;
BEGIN
  -- Solo admins pueden ejecutar esta función
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can cancel unpaid orders';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      updated_at = now()
  WHERE status = 'pending'
    AND payment_status = 'pending_payment'
    AND created_at < now() - INTERVAL '72 hours';
  
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Script completado
-- Verifica que todo se ejecutó correctamente
SELECT 'Setup completo - Checkout listo para usar' AS status;
