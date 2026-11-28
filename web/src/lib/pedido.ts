import type { ItemCarrinho } from '@/lib/carrinho'

// ---------- nomes e observacoes ----------

export function nomeDoItem(item: { nomeProduto: string; tamanho: string | null }): string {
  return item.tamanho ? `${item.nomeProduto} ${item.tamanho}` : item.nomeProduto
}

// O create_order tem UM so p_notes; no site as observacoes sao POR ITEM.
// Junta tudo: uma linha por item que tenha observacao.
export function montarObservacoes(itens: ItemCarrinho[]): string {
  return itens
    .filter((i) => i.observacoes.trim() !== '')
    .map((i) => {
      const sabor = i.nomeSabor ? ` (${i.nomeSabor})` : ''
      return `${nomeDoItem(i)}${sabor}: ${i.observacoes.trim()}`
    })
    .join('\n')
}

// ---------- resposta do create_order ----------

export type RespostaPedido = {
  order_id: string
  total_cents: number
  deposit_cents: number
  hold_expires_at: string
}

export function respostaValida(x: unknown): x is RespostaPedido {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.order_id === 'string' &&
    typeof r.total_cents === 'number' &&
    typeof r.deposit_cents === 'number' &&
    typeof r.hold_expires_at === 'string'
  )
}

// ---------- erros do banco, em portugues claro ----------

export type ErroPedido = {
  mensagem: string
  acao: 'agendamento' | 'carrinho' | 'dados' | null
}

// O banco devolve mensagens em portugues SEM acento; aqui reconhecemos o trecho
// e mostramos um texto amigavel. E so apresentacao: a regra continua no banco.
export function traduzirErroPedido(texto: string): ErroPedido {
  const t = texto.toLowerCase()

  if (t.includes('prazo insuficiente')) {
    const m = texto.match(/primeira retirada possivel e ([^.]+)\./i)
    const dica = m ? ` A primeira retirada possível é ${m[1]}.` : ''
    return {
      mensagem: `Esse horário já não respeita o prazo do seu pedido.${dica} Escolha outro horário.`,
      acao: 'agendamento',
    }
  }
  if (t.includes('nao ha vagas')) {
    return {
      mensagem: 'Esse dia acabou de ficar sem vagas. Escolha outro horário.',
      acao: 'agendamento',
    }
  }
  if (t.includes('pronta entrega insuficiente')) {
    return {
      mensagem:
        'A pronta entrega desse dia acabou de esgotar. Escolha outro dia ou diminua a quantidade.',
      acao: 'agendamento',
    }
  }
  if (t.includes('aguardando confirmacao')) {
    return {
      mensagem:
        'Você já tem um pedido aguardando confirmação da loja. Espere a resposta pelo WhatsApp antes de fazer outro.',
      acao: null,
    }
  }
  if (t.includes('telefone valido')) {
    return { mensagem: 'Confira o seu telefone, com DDD.', acao: 'dados' }
  }
  if (t.includes('informe seu nome')) {
    return { mensagem: 'Confira o seu nome.', acao: 'dados' }
  }
  if (t.includes('nao esta mais disponivel')) {
    return { mensagem: 'Um dos bolos do carrinho não está mais disponível.', acao: 'carrinho' }
  }
  if (/failed to fetch|network|fetch|timeout|load failed/i.test(texto)) {
    return {
      mensagem: 'Não conseguimos falar com o servidor. Confira a internet e tente de novo.',
      acao: null,
    }
  }
  return {
    mensagem:
      'Não foi possível enviar o pedido. Confira o horário e os itens e tente de novo.',
    acao: 'agendamento',
  }
}

// ---------- copia do pedido enviado (para a tela de Confirmacao) ----------

export type ItemEnviado = {
  nomeProduto: string
  tamanho: string | null
  nomeSabor: string | null
  quantidade: number
  precoUnitarioCentavos: number
  observacoes: string
}

export type PedidoEnviado = {
  orderId: string
  totalCentavos: number
  entradaCentavos: number
  holdExpiraEm: string
  nome: string
  telefone: string
  data: string
  hora: string
  itens: ItemEnviado[]
}

const CHAVE_PEDIDO = 'juliete:pedido-enviado:v1'

function itemEnviadoValido(x: unknown): x is ItemEnviado {
  if (typeof x !== 'object' || x === null) return false
  const i = x as Record<string, unknown>
  return (
    typeof i.nomeProduto === 'string' &&
    (i.tamanho === null || typeof i.tamanho === 'string') &&
    (i.nomeSabor === null || typeof i.nomeSabor === 'string') &&
    typeof i.quantidade === 'number' &&
    typeof i.precoUnitarioCentavos === 'number' &&
    typeof i.observacoes === 'string'
  )
}

export function lerPedidoEnviado(): PedidoEnviado | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_PEDIDO)
    if (!bruto) return null
    const p: unknown = JSON.parse(bruto)
    if (typeof p !== 'object' || p === null) return null
    const x = p as Record<string, unknown>
    if (
      typeof x.orderId === 'string' &&
      typeof x.totalCentavos === 'number' &&
      typeof x.entradaCentavos === 'number' &&
      typeof x.holdExpiraEm === 'string' &&
      typeof x.nome === 'string' &&
      typeof x.telefone === 'string' &&
      typeof x.data === 'string' &&
      typeof x.hora === 'string' &&
      Array.isArray(x.itens) &&
      x.itens.every(itemEnviadoValido)
    ) {
      return {
        orderId: x.orderId,
        totalCentavos: x.totalCentavos,
        entradaCentavos: x.entradaCentavos,
        holdExpiraEm: x.holdExpiraEm,
        nome: x.nome,
        telefone: x.telefone,
        data: x.data,
        hora: x.hora,
        itens: x.itens,
      }
    }
    return null
  } catch {
    return null
  }
}

export function salvarPedidoEnviado(pedido: PedidoEnviado | null): void {
  try {
    if (pedido) window.localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido))
    else window.localStorage.removeItem(CHAVE_PEDIDO)
  } catch {
    // sem armazenamento: a confirmacao so funciona enquanto a aba estiver aberta
  }
}