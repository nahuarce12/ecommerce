alter table public.categories
  add column if not exists size_measure_schema jsonb;

alter table public.product_sizes
  add column if not exists measurements jsonb;

alter table public.categories
  add constraint categories_size_measure_schema_array
  check (
    size_measure_schema is null
    or jsonb_typeof(size_measure_schema) = 'array'
  ) not valid;

alter table public.product_sizes
  add constraint product_sizes_measurements_object
  check (
    measurements is null
    or jsonb_typeof(measurements) = 'object'
  ) not valid;
