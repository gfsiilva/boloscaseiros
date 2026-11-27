export type Categoria = {
  id: string
  name: string
}

export type Produto = {
  id: string
  category_id: string
  name: string
  description: string | null
  price_cents: number
  size_label: string | null
  product_group: string | null
  production_type: 'simple' | 'special'
  is_ready_made: boolean
  image_path: string | null
}

export type CartaoDoCardapio = {
  chave: string
  nome: string
  descricao: string | null
  precoAPartirDe: number
  idDoLink: string
  tamanhos: string[]
  encomenda: boolean
  prontaEntrega: boolean
  imagePath: string | null
}