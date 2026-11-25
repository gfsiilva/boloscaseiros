-- Politicas de escrita: so admin escreve no cardapio, agenda e configuracoes

-- categories
create policy "Admin le todas as categorias" on public.categories
  for select to authenticated using ((select public.is_admin()));
create policy "Admin cria categorias" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin edita categorias" on public.categories
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- products
create policy "Admin le todos os produtos" on public.products
  for select to authenticated using ((select public.is_admin()));
create policy "Admin cria produtos" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin edita produtos" on public.products
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- production_days
create policy "Admin le todos os dias" on public.production_days
  for select to authenticated using ((select public.is_admin()));
create policy "Admin cria dias" on public.production_days
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin edita dias" on public.production_days
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- pickup_slots
create policy "Admin le todos os horarios" on public.pickup_slots
  for select to authenticated using ((select public.is_admin()));
create policy "Admin cria horarios" on public.pickup_slots
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin edita horarios" on public.pickup_slots
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- business_settings (linha unica: so ler e editar)
create policy "Admin le configuracoes" on public.business_settings
  for select to authenticated using ((select public.is_admin()));
create policy "Admin edita configuracoes" on public.business_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
