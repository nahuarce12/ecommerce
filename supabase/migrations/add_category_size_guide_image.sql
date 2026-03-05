alter table public.categories
  add column if not exists size_guide_image_url text;
