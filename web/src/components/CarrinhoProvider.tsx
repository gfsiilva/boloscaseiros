import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import {
  assinaturaCarrinho,
  lerRetirada,
  lerSalvo,
  reduzir,
  salvar,
  salvarRetirada,
  type NovaRetirada,
  type NovoItem,
  type Retirada,
} from '@/lib/carrinho'
import { CarrinhoContexto } from '@/lib/CarrinhoContexto'

export default function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, dispatch] = useReducer(reduzir, undefined, lerSalvo)
  const [retiradaSalva, setRetiradaSalva] = useState<Retirada | null>(lerRetirada)

  useEffect(() => {
    salvar(itens)
  }, [itens])

  useEffect(() => {
    salvarRetirada(retiradaSalva)
  }, [retiradaSalva])

  const assinatura = useMemo(() => assinaturaCarrinho(itens), [itens])
  const retirada =
    retiradaSalva && retiradaSalva.assinatura === assinatura ? retiradaSalva : null

  const valor = useMemo(
    () => ({
      itens,
      retirada,
      adicionar: (item: NovoItem) =>
        dispatch({ tipo: 'adicionar', id: crypto.randomUUID(), item }),
      alterarQuantidade: (id: string, quantidade: number) =>
        dispatch({ tipo: 'quantidade', id, quantidade }),
      remover: (id: string) => dispatch({ tipo: 'remover', id }),
      escolherRetirada: (nova: NovaRetirada) => setRetiradaSalva({ ...nova, assinatura }),
      limpar: () => {
        dispatch({ tipo: 'limpar' })
        setRetiradaSalva(null)
      },
    }),
    [itens, retirada, assinatura],
  )

  return <CarrinhoContexto.Provider value={valor}>{children}</CarrinhoContexto.Provider>
}