import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router'
import { entradaCentavos, type ItemCarrinho } from '@/lib/carrinho'
import { formatarDataCurta } from '@/lib/datas'
import { formatarReais } from '@/lib/dinheiro'
import { numeroWhatsappValido } from '@/lib/loja'
import {
  montarObservacoes,
  nomeDoItem,
  respostaValida,
  salvarPedidoEnviado,
  traduzirErroPedido,
  type ErroPedido,
  type PedidoEnviado,
} from '@/lib/pedido'
import { supabase } from '@/lib/supabase'
import { useCarrinho } from '@/lib/useCarrinho'
import { linkWhatsapp } from '@/lib/whatsapp'

const LIMITE_NOTAS = 500

// TEMPORARIO: estes textos (e os numeros 50% e 2 horas) ainda estao fixos aqui.
// Depois vao para o banco (business_settings), como os textos da home.
const CONDICOES = [
  'A entrada de 50% é combinada pelo WhatsApp. É ela que garante a sua vaga.',
  'Seu horário fica reservado por 2 horas. Sem a entrada nesse prazo, a vaga é liberada.',
  'A retirada é no local. Não fazemos entrega.',
  'Mudanças e cancelamentos são combinados pelo WhatsApp.',
]

type LinhaProduto = {
  id: string
  price_cents: number
  active: boolean
  deleted_at: string | null
}

type LinhaSabor = {
  id: string
  price_cents: number
  active: boolean
}

type Conferencia =
  | { estado: 'carregando' }
  | { estado: 'ok'; precos: Record<string, number>; indisponiveis: string[] }
  | { estado: 'falhou' }

const linkAcao =
  'mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-2'

export default function Revisao() {
  const navigate = useNavigate()
  const { itens, retirada, cliente, limpar } = useCarrinho()

  const [conferencia, setConferencia] = useState<Conferencia>({ estado: 'carregando' })
  const [aceitou, setAceitou] = useState(false)
  const [erroTermos, setErroTermos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<ErroPedido | null>(null)
  const [concluido, setConcluido] = useState(false)

  // Reconfere precos e disponibilidade no banco (o preco guardado no carrinho pode estar velho)
  useEffect(() => {
    if (itens.length === 0) return
    let cancelado = false

    async function conferir() {
      try {
        const produtoIds = [...new Set(itens.map((i) => i.produtoId))]
        const saborIds = [...new Set(itens.flatMap((i) => (i.saborId ? [i.saborId] : [])))]

        const rProd = await supabase
          .from('products')
          .select('id, price_cents, active, deleted_at')
          .in('id', produtoIds)
        if (rProd.error) throw rProd.error
        const produtos = (rProd.data ?? []) as unknown as LinhaProduto[]

        let sabores: LinhaSabor[] = []
        if (saborIds.length > 0) {
          const rSab = await supabase
            .from('product_flavors')
            .select('id, price_cents, active')
            .in('id', saborIds)
          if (rSab.error) throw rSab.error
          sabores = (rSab.data ?? []) as unknown as LinhaSabor[]
        }

        const mapaProdutos = new Map(produtos.map((p) => [p.id, p]))
        const mapaSabores = new Map(sabores.map((s) => [s.id, s]))
        const precos: Record<string, number> = {}
        const indisponiveis: string[] = []

        for (const item of itens) {
          const p = mapaProdutos.get(item.produtoId)
          if (!p || !p.active || p.deleted_at !== null) {
            indisponiveis.push(item.id)
            continue
          }
          if (item.saborId) {
            const s = mapaSabores.get(item.saborId)
            if (!s || !s.active) {
              indisponiveis.push(item.id)
              continue
            }
            precos[item.id] = s.price_cents
          } else {
            precos[item.id] = p.price_cents
          }
        }

        if (!cancelado) setConferencia({ estado: 'ok', precos, indisponiveis })
      } catch (e) {
        console.error('Nao foi possivel conferir os precos:', e)
        if (!cancelado) setConferencia({ estado: 'falhou' })
      }
    }

    void conferir()
    return () => {
      cancelado = true
    }
  }, [itens])

  // Depois de enviar, o carrinho some e a tela nao deve piscar vazia nem redirecionar
  if (concluido) return null

  // Sem carrinho, horario ou dados nao ha o que revisar: volta para o passo certo
  if (itens.length === 0) return <Navigate to="/carrinho" replace />
  if (!retirada) return <Navigate to="/agendamento" replace />
  if (!cliente) return <Navigate to="/dados" replace />

  const precoDoItem = (item: ItemCarrinho): number =>
    conferencia.estado === 'ok'
      ? (conferencia.precos[item.id] ?? item.precoUnitarioCentavos)
      : item.precoUnitarioCentavos

  const indisponiveis = conferencia.estado === 'ok' ? conferencia.indisponiveis : []
  const precosMudaram =
    conferencia.estado === 'ok' &&
    itens.some((i) => precoDoItem(i) !== i.precoUnitarioCentavos)

  const total = itens.reduce((soma, i) => soma + precoDoItem(i) * i.quantidade, 0)
  const entrada = entradaCentavos(total)

  const observacoes = montarObservacoes(itens)
  const notasLongas = observacoes.length > LIMITE_NOTAS
  const conferindo = conferencia.estado === 'carregando'
  const travado = enviando || conferindo || indisponiveis.length > 0 || notasLongas

  const enviar = async () => {
    if (enviando) return
    if (!aceitou) {
      setErroTermos(true)
      return
    }
    // Nunca cria um pedido se nao ha para onde mandar a mensagem
    if (!numeroWhatsappValido()) {
      setErro({
        mensagem: 'O número de WhatsApp da loja ainda não foi configurado. Tente mais tarde.',
        acao: null,
      })
      return
    }

    // Abre a aba do WhatsApp AGORA, no toque do cliente: se abrisse so depois da espera
    // do banco, o celular poderia bloquear. Depois mandamos esta aba para o link certo.
    const janela = window.open('', '_blank')
    if (janela) {
      janela.opener = null
      try {
        janela.document.title = 'Enviando pedido...'
        janela.document.body.textContent = 'Enviando o seu pedido, só um instante...'
      } catch {
        // sem acesso ao documento da aba: ela fica em branco ate o link chegar
      }
    }
    const fecharJanela = () => {
      try {
        janela?.close()
      } catch {
        // ja estava fechada
      }
    }

    setEnviando(true)
    setErro(null)
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_name: cliente.nome,
        p_phone: cliente.telefone,
        p_pickup_slot_id: retirada.slotId,
        p_items: itens.map((i) => ({
          product_id: i.produtoId,
          quantity: i.quantidade,
          ...(i.saborId ? { flavor_id: i.saborId } : {}),
        })),
        p_notes: observacoes === '' ? null : observacoes,
      })

      if (error) {
        console.error('create_order falhou:', error)
        fecharJanela()
        setErro(traduzirErroPedido(error.message))
        return
      }
      if (!respostaValida(data)) {
        console.error('create_order devolveu algo inesperado:', data)
        fecharJanela()
        setErro(traduzirErroPedido(''))
        return
      }

      // Guarda a copia ANTES de limpar o carrinho; os valores finais sao os do servidor
      const pedido: PedidoEnviado = {
        orderId: data.order_id,
        totalCentavos: data.total_cents,
        entradaCentavos: data.deposit_cents,
        holdExpiraEm: data.hold_expires_at,
        nome: cliente.nome,
        telefone: cliente.telefone,
        data: retirada.data,
        hora: retirada.hora,
        itens: itens.map((i) => ({
          nomeProduto: i.nomeProduto,
          tamanho: i.tamanho,
          nomeSabor: i.nomeSabor,
          quantidade: i.quantidade,
          precoUnitarioCentavos: precoDoItem(i),
          observacoes: i.observacoes.trim(),
        })),
      }
      salvarPedidoEnviado(pedido)

      // Manda a aba que ja estava aberta para o WhatsApp, com a mensagem pronta.
      // Se o navegador bloqueou a aba, a Confirmacao tem um link para tentar de novo.
      if (janela) janela.location.href = linkWhatsapp(pedido)

      setConcluido(true)
      limpar()
      navigate('/confirmacao', { replace: true })
    } catch (e) {
      console.error('create_order lancou erro:', e)
      fecharJanela()
      setErro(traduzirErroPedido(e instanceof Error ? e.message : ''))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl">Revise seu pedido</h1>
          <p className="mt-2 text-marrom-suave">
            Confira tudo antes de enviar. Nada é cobrado agora.
          </p>
        </div>

        {precosMudaram && (
          <p
            role="status"
            className="rounded-xl border border-caramelo/40 bg-white p-4 text-sm text-marrom"
          >
            O valor de alguns bolos mudou desde que você os adicionou. Mostramos o valor atual.
          </p>
        )}

        {indisponiveis.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>
              Um ou mais bolos do carrinho não estão mais disponíveis. Remova-os no carrinho para
              continuar.
            </p>
            <Link to="/carrinho" className={linkAcao}>
              Ver carrinho
            </Link>
          </div>
        )}

        {conferencia.estado === 'falhou' && (
          <p className="text-sm text-marrom-suave">
            Não conseguimos conferir os valores agora. O valor final é o da loja e aparece depois
            do envio.
          </p>
        )}

        <section
          aria-labelledby="titulo-itens"
          className="rounded-2xl border border-bege bg-white p-5"
        >
          <h2 id="titulo-itens" className="text-xl">
            Seus bolos
          </h2>
          <ul className="mt-2 divide-y divide-bege">
            {itens.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-marrom">
                    {item.quantidade}× {nomeDoItem(item)}
                  </p>
                  {item.nomeSabor && (
                    <p className="text-sm text-marrom-suave">Sabor: {item.nomeSabor}</p>
                  )}
                  {item.observacoes.trim() !== '' && (
                    <p className="break-words text-sm text-marrom-suave">
                      Obs.: {item.observacoes.trim()}
                    </p>
                  )}
                  {indisponiveis.includes(item.id) && (
                    <p className="text-sm font-semibold text-red-700">Não está mais disponível</p>
                  )}
                </div>
                <p className="shrink-0 text-marrom">
                  {formatarReais(precoDoItem(item) * item.quantidade)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="titulo-retirada"
          className="rounded-2xl border border-bege bg-white p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-retirada" className="text-xl">
              Retirada
            </h2>
            <Link
              to="/agendamento"
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-caramelo-escuro"
            >
              Alterar
            </Link>
          </div>
          <p className="text-marrom">
            {formatarDataCurta(retirada.data)} às {retirada.hora}
          </p>
          <p className="text-sm text-marrom-suave">Retirada no local, sem entrega.</p>
        </section>

        <section
          aria-labelledby="titulo-cliente"
          className="rounded-2xl border border-bege bg-white p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-cliente" className="text-xl">
              Seus dados
            </h2>
            <Link
              to="/dados"
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-caramelo-escuro"
            >
              Alterar
            </Link>
          </div>
          <p className="break-words text-marrom">{cliente.nome}</p>
          <p className="text-sm text-marrom-suave">{cliente.telefone}</p>
        </section>
      </div>

      <aside className="space-y-5 rounded-2xl border border-bege bg-pessego p-5 lg:sticky lg:top-6">
        <dl className="space-y-1 text-marrom">
          <div className="flex justify-between">
            <dt>Total</dt>
            <dd className="font-semibold">{formatarReais(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Entrada (50%)</dt>
            <dd>{formatarReais(entrada)}</dd>
          </div>
          <div className="flex justify-between text-marrom-suave">
            <dt>Saldo na retirada</dt>
            <dd>{formatarReais(total - entrada)}</dd>
          </div>
        </dl>

        <div className="border-t border-bege pt-4">
          <h2 className="text-base font-semibold text-marrom">Condições de encomenda</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-marrom-suave">
            {CONDICOES.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ul>
        </div>

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-marrom">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => {
                setAceitou(e.target.checked)
                setErroTermos(false)
              }}
              className="mt-0.5 size-6 shrink-0 accent-caramelo-escuro"
            />
            <span>Li e concordo com as condições de encomenda</span>
          </label>
          {erroTermos && !aceitou && (
            <p className="mt-1 text-sm text-red-700">Marque a caixa para enviar o pedido.</p>
          )}
        </div>

        {notasLongas && (
          <p role="alert" className="text-sm text-red-700">
            As observações dos bolos passaram de {LIMITE_NOTAS} caracteres. Volte ao carrinho,
            remova o bolo e adicione de novo com um texto menor.
          </p>
        )}

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>{erro.mensagem}</p>
            {erro.acao === 'agendamento' && (
              <Link to="/agendamento" className={linkAcao}>
                Escolher outro horário
              </Link>
            )}
            {erro.acao === 'carrinho' && (
              <Link to="/carrinho" className={linkAcao}>
                Ver carrinho
              </Link>
            )}
            {erro.acao === 'dados' && (
              <Link to="/dados" className={linkAcao}>
                Corrigir meus dados
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={enviar}
            disabled={travado}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-sucesso px-8 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            {enviando
              ? 'Enviando...'
              : conferindo
                ? 'Conferindo valores...'
                : 'Finalizar pelo WhatsApp'}
          </button>
          <p className="text-center text-sm text-marrom-suave">
            Vamos registrar o pedido e abrir o WhatsApp com a mensagem pronta. A entrada é
            confirmada pela loja.
          </p>
          <Link
            to="/dados"
            className="flex min-h-11 items-center justify-center font-semibold text-marrom-suave hover:text-marrom"
          >
            Voltar
          </Link>
        </div>
      </aside>
    </div>
  )
}