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
import { lerCliente, salvarCliente, type Cliente } from '@/lib/cliente'
import { CarrinhoContexto } from '@/lib/CarrinhoContexto'

export default function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, dispatch] = useReducer(reduzir, undefined, lerSalvo)
  const [retiradaSalva, setRetiradaSalva] = useState<Retirada | null>(lerRetirada)
  const [cliente, setCliente] = useState<Cliente | null>(lerCliente)

  useEffect(() => {
    salvar(itens)
  }, [itens])

  useEffect(() => {
    salvarRetirada(retiradaSalva)
  }, [retiradaSalva])

  useEffect(() => {
    salvarCliente(cliente)
  }, [cliente])

  const assinatura = useMemo(() => assinaturaCarrinho(itens), [itens])
  const retirada =
    retiradaSalva && retiradaSalva.assinatura === assinatura ? retiradaSalva : null

  const valor = useMemo(
    () => ({
      itens,
      retirada,
      cliente,
      adicionar: (item: NovoItem) =>
        dispatch({ tipo: 'adicionar', id: crypto.randomUUID(), item }),
      alterarQuantidade: (id: string, quantidade: number) =>
        dispatch({ tipo: 'quantidade', id, quantidade }),
      remover: (id: string) => dispatch({ tipo: 'remover', id }),
      escolherRetirada: (nova: NovaRetirada) => setRetiradaSalva({ ...nova, assinatura }),
      definirCliente: (novo: Cliente) => setCliente(novo),
      // limpa so o carrinho e a retirada; nome e telefone ficam para o proximo pedido
      limpar: () => {
        dispatch({ tipo: 'limpar' })
        setRetiradaSalva(null)
      },
    }),
    [itens, retirada, cliente, assinatura],
  )

  return <CarrinhoContexto.Provider value={valor}>{children}</CarrinhoContexto.Provider>
}