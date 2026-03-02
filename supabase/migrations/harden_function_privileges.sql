alter function public.handle_new_user() set search_path = public;
alter function public.sync_product_total_stock() set search_path = public;
alter function public.restore_stock_on_cancel() set search_path = public;
alter function public.cancel_unpaid_orders() set search_path = public;
alter function public.decrement_stock(uuid, integer, text) set search_path = public;
alter function public.cancel_expired_pending_orders() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_product_total_stock() from public, anon, authenticated;
revoke execute on function public.restore_stock_on_cancel() from public, anon, authenticated;
revoke execute on function public.cancel_unpaid_orders() from public, anon;
revoke execute on function public.decrement_stock(uuid, integer, text) from public, anon;
revoke execute on function public.cancel_expired_pending_orders() from public, anon, authenticated;

grant execute on function public.cancel_unpaid_orders() to authenticated;
grant execute on function public.decrement_stock(uuid, integer, text) to authenticated;
grant execute on function public.cancel_expired_pending_orders() to service_role;
