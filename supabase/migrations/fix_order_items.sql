-- ⚠️ EJECUTA ESTE SCRIPT PRIMERO EN TU SUPABASE SQL EDITOR
-- Este script verifica y agrega la columna product_name si no existe

-- Agregar columna product_name a order_items si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_name'
  ) THEN
    ALTER TABLE public.order_items 
    ADD COLUMN product_name text NOT NULL DEFAULT 'Unknown Product';
    
    -- Actualizar productos existentes con el nombre real si es posible
    UPDATE public.order_items oi
    SET product_name = p.name
    FROM public.products p
    WHERE oi.product_id = p.id
    AND oi.product_name = 'Unknown Product';
    
    RAISE NOTICE 'Columna product_name agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna product_name ya existe';
  END IF;
END $$;

-- Permitir NULL en color y size (para productos que no necesitan estas opciones)
-- O agregar valor por defecto si ya existen registros con NULL
ALTER TABLE public.order_items 
  ALTER COLUMN size DROP NOT NULL,
  ALTER COLUMN color DROP NOT NULL;

-- Actualizar valores NULL existentes con un valor por defecto
UPDATE public.order_items 
SET size = 'ÚNICO' 
WHERE size IS NULL;

UPDATE public.order_items 
SET color = 'DEFAULT' 
WHERE color IS NULL;

RAISE NOTICE 'Columnas size y color actualizadas para permitir valores por defecto';

-- Verificar que la columna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY ordinal_position;
