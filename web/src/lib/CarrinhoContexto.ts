import { createContext } from 'react'
import type { ItemCarrinho, NovoItem } from '@/lib/carrinho'

export type ValorCarrinho = {
  itens: ItemCarrinho[]
  adicionar: (item: NovoItem) => void
  alterarQuantidade: (id: string, quantidade: number) => void
  remover: (id: string) => void
  limpar: () => void
}

export const CarrinhoContexto = createContext<ValorCarrinho | null>(null)