import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Minus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatarReais } from '@/lib/dinheiro'
import { useCarrinho } from '@/lib/useCarrinho'

type ProdutoDetalhe = {
  id: string
  name: string
  description: string | null
  price_cents: number
  size_label: string | null
  product_group: string | null
  is_ready_made: boolean
  max_per_order: number
  preparation_lead_time_hours: number
}

type Sabor = {
  id: string
  product_id: string
  name: string
  price_cents: number
  sort_order: number
}

const CAMPOS =
  'id, name, description, price_cents, size_label, product_group, is_ready_made, max_per_order, preparation_lead_time_hours'

function textoDoPrazo(horas: number): string {
  if (horas % 24 === 0) {
    const dias = horas / 24
    return dias === 1 ? '1 dia' : `${dias} dias`
  }
  return `${horas} horas`
}

export default function Produto() {
  const { id } = useParams()
  const { adicionar } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  const [produtos, setProdutos] = useState<ProdutoDetalhe[] | null>(null)
  const [sabores, setSabores] = useState<Sabor[]>([])
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [produtoId, setProdutoId] = useState<string>('')
  const [saborId, setSaborId] = useState<string>('')
  const [quantidade, setQuantidade] = useState(1)
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const { data: atual, error: erroAtual } = await supabase
        .from('products')
        .select(CAMPOS)
        .eq('id', id ?? '')
        .eq('active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (cancelado) return
      if (erroAtual || !atual) return setNaoEncontrado(true)

      const escolhido = atual as ProdutoDetalhe
      let lista: ProdutoDetalhe[] = [escolhido]

      if (escolhido.product_group) {
        const { data: irmaos, error: erroIrmaos } = await supabase
          .from('products')
          .select(CAMPOS)
          .eq('product_group', escolhido.product_group)
          .eq('active', true)
          .is('deleted_at', null)
        if (cancelado) return
        if (erroIrmaos) return setErro(erroIrmaos.message)
        lista = (irmaos as ProdutoDetalhe[]).sort((a, b) => a.price_cents - b.price_cents)
      }

      const { data: dadosSabores, error: erroSabores } = await supabase
        .from('product_flavors')
        .select('id, product_id, name, price_cents, sort_order')
        .in('product_id', lista.map((p) => p.id))
        .eq('active', true)
        .order('sort_order')
      if (cancelado) return
      if (erroSabores) return setErro(erroSabores.message)

      const todosSabores = dadosSabores as Sabor[]
      const primeiro = todosSabores.find((s) => s.product_id === escolhido.id)

      setSabores(todosSabores)
      setProdutos(lista)
      setProdutoId(escolhido.id)
      setSaborId(primeiro?.id ?? '')
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [id])

  if (naoEncontrado) {
    return (
      <section>
        <h1 className="text-3xl">Bolo não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          Esse bolo não existe ou não está mais à venda.{' '}
          <Link to="/cardapio" className="font-semibold text-primary underline">
            Ver o cardápio
          </Link>
        </p>
      </section>
    )
  }

  if (erro) {
    return <p className="text-destructive">Não foi possível carregar o bolo: {erro}</p>
  }

  if (produtos === null) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  const produto = produtos.find((p) => p.id === produtoId) ?? produtos[0]
  const saboresDoProduto = sabores.filter((s) => s.product_id === produto.id)
  const sabor = saboresDoProduto.find((s) => s.id === saborId) ?? null
  const precoUnitario = sabor ? sabor.price_cents : produto.price_cents
  const nomeDoBolo =
    produto.name.replace(produto.size_label ?? '', '').trim() || produto.name

  function trocarTamanho(novoId: string) {
    const nomeAtual = sabor?.name
    const novos = sabores.filter((s) => s.product_id === novoId)
    const mesmoSabor = novos.find((s) => s.name === nomeAtual)
    const novoProduto = produtos?.find((p) => p.id === novoId)
    setProdutoId(novoId)
    setSaborId((mesmoSabor ?? novos[0])?.id ?? '')
    if (novoProduto) setQuantidade((q) => Math.min(q, novoProduto.max_per_order))
  }

  function adicionarAoCarrinho() {
    adicionar({
      produtoId: produto.id,
      saborId: sabor?.id ?? null,
      nomeProduto: nomeDoBolo,
      tamanho: produto.size_label,
      nomeSabor: sabor?.name ?? null,
      precoUnitarioCentavos: precoUnitario,
      quantidade,
      maxPorPedido: produto.max_per_order,
      observacoes: observacoes.trim(),
    })
    setAdicionado(true)
    window.setTimeout(() => setAdicionado(false), 4000)
  }
  const classeCaixa = (selecionada: boolean) =>
    `min-h-11 rounded-xl border px-4 py-2 text-left text-sm transition ${
      selecionada
        ? 'border-primary bg-card ring-2 ring-primary'
        : 'border-border bg-card hover:border-dourado'
    }`

  return (
    <section>
      <Link to="/cardapio" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar ao cardápio
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
          Foto em breve
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {produto.is_ready_made ? (
              <span className="rounded-full bg-sucesso px-2.5 py-0.5 text-xs text-white">
                Pronta entrega
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                Sob encomenda
              </span>
            )}
          </div>

          <h1 className="mt-2 text-3xl">{nomeDoBolo}</h1>
          {produto.description && (
            <p className="mt-2 text-muted-foreground">{produto.description}</p>
          )}

          {produtos.length > 1 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">Tamanho</h2>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Tamanho">
                {produtos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={p.id === produto.id}
                    className={classeCaixa(p.id === produto.id)}
                    onClick={() => trocarTamanho(p.id)}
                  >
                    {p.size_label ?? p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {saboresDoProduto.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">Sabor</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label="Sabor">
                {saboresDoProduto.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={s.id === saborId}
                    className={classeCaixa(s.id === saborId)}
                    onClick={() => setSaborId(s.id)}
                  >
                    <span className="block">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatarReais(s.price_cents)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="obs" className="text-sm font-semibold">
              Observações (opcional)
            </label>
            <textarea
              id="obs"
              rows={3}
              maxLength={300}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: sem granulado, recado no bolo..."
              className="mt-2 w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Quer mudar algo? Siga com o pedido. Se o valor mudar, combinamos pelo WhatsApp.
            </p>
          </div>

          {!produto.is_ready_made && (
            <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Este produto é feito sob encomenda. Prazo mínimo:{' '}
              {textoDoPrazo(produto.preparation_lead_time_hours)}.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 rounded-full border border-border bg-card">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                className="flex size-11 items-center justify-center disabled:opacity-40"
                disabled={quantidade <= 1}
                onClick={() => setQuantidade((q) => q - 1)}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center" aria-live="polite">
                {quantidade}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                className="flex size-11 items-center justify-center disabled:opacity-40"
                disabled={quantidade >= produto.max_per_order}
                onClick={() => setQuantidade((q) => q + 1)}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <p className="text-2xl font-semibold text-primary">
              {formatarReais(precoUnitario * quantidade)}
            </p>
          </div>

          <button
            type="button"
            onClick={adicionarAoCarrinho}
            className="mt-4 min-h-12 w-full rounded-full bg-primary px-6 text-primary-foreground transition hover:opacity-90"
          >
            Adicionar ao carrinho
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {adicionado ? (
              <>
                Adicionado!{' '}
                <Link to="/carrinho" className="font-semibold text-primary underline">
                  Ver carrinho
                </Link>
              </>
            ) : (
              'Você pode revisar tudo no carrinho antes de enviar.'
            )}
          </p>
        </div>
      </div>
    </section>
  )
}