alter table public.products
  add column product_group text;

alter table public.products
  add constraint products_product_group_slug_check
  check (product_group is null or product_group ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

comment on column public.products.product_group is
  'Agrupa produtos que sao tamanhos do mesmo bolo (slug). Nulo = produto sozinho. Apenas apresentacao: pontos, prazo e preco continuam em cada produto.';
