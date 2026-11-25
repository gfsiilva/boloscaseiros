create policy "Admin le clientes"
  on public.customers for select to authenticated
  using ((select public.is_admin()));

create policy "Admin le pedidos"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy "Admin le itens dos pedidos"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

create policy "Admin le pagamentos"
  on public.payments for select to authenticated
  using ((select public.is_admin()));

create policy "Admin le reservas"
  on public.production_reservations for select to authenticated
  using ((select public.is_admin()));
