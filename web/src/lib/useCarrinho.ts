import { useContext } from 'react'
import { CarrinhoContexto } from '@/lib/CarrinhoContexto'

export function useCarrinho() {
  const valor = useContext(CarrinhoContexto)
  if (!valor) {
    throw new Error('useCarrinho precisa estar dentro do CarrinhoProvider.')
  }
  return valor
}