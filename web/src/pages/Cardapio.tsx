import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import CartaoProduto from '@/components/CartaoProduto'
import type { Categoria, Produto, CartaoDoCardapio } from '@/lib/tipos'

function montarCartoes(produtos: Produto[]): CartaoDoCardapio[] {
  const cartoes: CartaoDoCardapio[] = []
  const porGrupo = new Map<string, Produto[]>()

  for (const p of produtos) {
    if (p.product_group) {
      const lista = porGrupo.get(p.product_group) ?? []
      lista.push(p)
      porGrupo.set(p.product_group, lista)
    } else {
      cartoes.push({
        chave: p.id,
        nome: p.name,
        descricao: p.description,
        precoAPartirDe: p.price_cents,
        idDoLink: p.id,
        tamanhos: p.size_label ? [p.size_label] : [],
        encomenda: !p.is_ready_made,
        prontaEntrega: p.is_ready_made,
        imagePath: p.image_path,
      })
    }
  }

  for (const [grupo, lista] of porGrupo) {
    const ordenados = [...lista].sort((a, b) => a.price_cents - b.price_cents)
    const menor = ordenados[0]
    cartoes.push({
      chave: grupo,
      nome: menor.name.replace(menor.size_label ?? '', '').trim() || menor.name,
      descricao: menor.description,
      precoAPartirDe: menor.price_cents,
      idDoLink: menor.id,
      tamanhos: ordenados.map((p) => p.size_label).filter((t): t is string => !!t),
      encomenda: ordenados.some((p) => !p.is_ready_made),
      prontaEntrega: ordenados.every((p) => p.is_ready_made),
      imagePath: menor.image_path,
    })
  }

  return cartoes.sort((a, b) => a.precoAPartirDe - b.precoAPartirDe)
}

export default function Cardapio() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [ativa, setAtiva] = useState<string>('todas')

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const [resCategorias, resProdutos] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase
          .from('products')
          .select(
            'id, category_id, name, description, price_cents, size_label, product_group, production_type, is_ready_made, image_path',
          )
          .eq('active', true)
          .is('deleted_at', null)
          .order('name'),
      ])

      if (cancelado) return
      if (resCategorias.error) return setErro(resCategorias.error.message)
      if (resProdutos.error) return setErro(resProdutos.error.message)

      setCategorias(resCategorias.data as Categoria[])
      setProdutos(resProdutos.data as Produto[])
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [])

  if (erro) {
    return <p className="text-destructive">Não foi possível carregar o cardápio: {erro}</p>
  }

  if (categorias === null) {
    return <p className="text-muted-foreground">Carregando o cardápio...</p>
  }

  const visiveis =
    ativa === 'todas' ? produtos : produtos.filter((p) => p.category_id === ativa)
  const cartoes = montarCartoes(visiveis)

  const classePilula = (selecionada: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm transition ${
      selecionada
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-foreground hover:bg-accent'
    }`

  return (
    <section>
      <h1 className="text-3xl">Nosso cardápio</h1>
      <p className="mt-1 text-muted-foreground">Bolos caseiros para todas as ocasiões.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          aria-pressed={ativa === 'todas'}
          className={classePilula(ativa === 'todas')}
          onClick={() => setAtiva('todas')}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={ativa === c.id}
            className={classePilula(ativa === c.id)}
            onClick={() => setAtiva(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {cartoes.map((cartao) => (
          <CartaoProduto key={cartao.chave} cartao={cartao} />
        ))}
      </div>
    </section>
  )
}