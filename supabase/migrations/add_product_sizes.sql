CREATE TABLE IF NOT EXISTS public.product_sizes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size_label text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  UNIQUE(product_id, size_label)
);

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product sizes are viewable by everyone"
  ON product_sizes FOR SELECT USING (true);

CREATE POLICY "Admins can insert product sizes"
  ON product_sizes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update product sizes"
  ON product_sizes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete product sizes"
  ON product_sizes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.sync_product_total_stock()
RETURNS trigger AS $$
DECLARE
  target_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE public.products
  SET stock = COALESCE((
    SELECT SUM(ps.stock) FROM public.product_sizes ps WHERE ps.product_id = target_product_id
  ), 0)
  WHERE id = target_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_product_sizes_change
  AFTER INSERT OR UPDATE OR DELETE ON public.product_sizes
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_product_total_stock();

CREATE OR REPLACE FUNCTION public.decrement_stock(product_id uuid, quantity integer, size_label text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF size_label IS NOT NULL AND size_label != 'ÚNICO' THEN
    UPDATE public.product_sizes
    SET stock = product_sizes.stock - quantity
    WHERE product_sizes.product_id = decrement_stock.product_id
      AND product_sizes.size_label = decrement_stock.size_label
      AND product_sizes.stock >= quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product % size %', product_id, size_label;
    END IF;
  ELSE
    UPDATE public.products
    SET stock = products.stock - quantity
    WHERE id = product_id
      AND stock >= quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', product_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.product_sizes
    SET stock = product_sizes.stock + oi.quantity
    FROM public.order_items oi
    WHERE product_sizes.product_id = oi.product_id
      AND product_sizes.size_label = oi.size
      AND oi.order_id = NEW.id
      AND oi.size IS NOT NULL
      AND oi.size != 'ÚNICO';

    UPDATE public.products
    SET stock = products.stock + oi.quantity
    FROM public.order_items oi
    WHERE products.id = oi.product_id
      AND oi.order_id = NEW.id
      AND (oi.size IS NULL OR oi.size = 'ÚNICO')
      AND NOT EXISTS (
        SELECT 1 FROM public.product_sizes ps
        WHERE ps.product_id = oi.product_id
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;

CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE PROCEDURE public.restore_stock_on_cancel();
