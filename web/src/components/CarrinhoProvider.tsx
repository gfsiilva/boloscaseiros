import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { lerSalvo, reduzir, salvar, type NovoItem } from '@/lib/carrinho'
import { CarrinhoContexto } from '@/lib/CarrinhoContexto'

export default function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, dispatch] = useReducer(reduzir, undefined, lerSalvo)

  useEffect(() => {
    salvar(itens)
  }, [itens])

  const valor = useMemo(
    () => ({
      itens,
      adicionar: (item: NovoItem) =>
        dispatch({ tipo: 'adicionar', id: crypto.randomUUID(), item }),
      alterarQuantidade: (id: string, quantidade: number) =>
        dispatch({ tipo: 'quantidade', id, quantidade }),
      remover: (id: string) => dispatch({ tipo: 'remover', id }),
      limpar: () => dispatch({ tipo: 'limpar' }),
    }),
    [itens],
  )

  return <CarrinhoContexto.Provider value={valor}>{children}</CarrinhoContexto.Provider>
}