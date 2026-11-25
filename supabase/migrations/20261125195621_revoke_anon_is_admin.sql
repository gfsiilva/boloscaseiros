-- Visitante nao precisa perguntar se e admin
revoke execute on function public.is_admin() from anon;
