import { createContext } from 'react'
import type { ItemCarrinho, NovoItem, NovaRetirada, Retirada } from '@/lib/carrinho'

export type ValorCarrinho = {
  itens: ItemCarrinho[]
  retirada: Retirada | null
  adicionar: (item: NovoItem) => void
  alterarQuantidade: (id: string, quantidade: number) => void
  remover: (id: string) => void
  escolherRetirada: (retirada: NovaRetirada) => void
  limpar: () => void
}

export const CarrinhoContexto = createContext<ValorCarrinho | null>(null)