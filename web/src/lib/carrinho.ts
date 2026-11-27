export type ItemCarrinho = {
  id: string
  produtoId: string
  saborId: string | null
  nomeProduto: string
  tamanho: string | null
  nomeSabor: string | null
  precoUnitarioCentavos: number
  quantidade: number
  maxPorPedido: number
  observacoes: string
}

export type NovoItem = Omit<ItemCarrinho, 'id'>

export type Acao =
  | { tipo: 'adicionar'; id: string; item: NovoItem }
  | { tipo: 'quantidade'; id: string; quantidade: number }
  | { tipo: 'remover'; id: string }
  | { tipo: 'limpar' }

export function reduzir(itens: ItemCarrinho[], acao: Acao): ItemCarrinho[] {
  switch (acao.tipo) {
    case 'adicionar': {
      const igual = itens.find(
        (i) =>
          i.produtoId === acao.item.produtoId &&
          i.saborId === acao.item.saborId &&
          i.observacoes === acao.item.observacoes,
      )
      if (igual) {
        return itens.map((i) =>
          i.id === igual.id
            ? {
                ...i,
                quantidade: Math.min(i.quantidade + acao.item.quantidade, i.maxPorPedido),
              }
            : i,
        )
      }
      return [...itens, { ...acao.item, id: acao.id }]
    }
    case 'quantidade':
      return itens.map((i) =>
        i.id === acao.id
          ? { ...i, quantidade: Math.max(1, Math.min(acao.quantidade, i.maxPorPedido)) }
          : i,
      )
    case 'remover':
      return itens.filter((i) => i.id !== acao.id)
    case 'limpar':
      return []
  }
}

export function totalCentavos(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.precoUnitarioCentavos * i.quantidade, 0)
}

export function quantidadeTotal(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0)
}

// Mesma regra do banco: 50% do total, arredondado para cima
export function entradaCentavos(total: number): number {
  return Math.ceil(total / 2)
}

const CHAVE = 'juliete:carrinho:v1'

function itemValido(x: unknown): x is ItemCarrinho {
  if (typeof x !== 'object' || x === null) return false
  const i = x as Record<string, unknown>
  return (
    typeof i.id === 'string' &&
    typeof i.produtoId === 'string' &&
    (i.saborId === null || typeof i.saborId === 'string') &&
    typeof i.nomeProduto === 'string' &&
    typeof i.precoUnitarioCentavos === 'number' &&
    typeof i.quantidade === 'number' &&
    typeof i.maxPorPedido === 'number' &&
    typeof i.observacoes === 'string'
  )
}

export function lerSalvo(): ItemCarrinho[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return []
    const dados: unknown = JSON.parse(bruto)
    return Array.isArray(dados) ? dados.filter(itemValido) : []
  } catch {
    return []
  }
}

export function salvar(itens: ItemCarrinho[]): void {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(itens))
  } catch {
    // navegador sem armazenamento: o carrinho segue valendo so enquanto a aba estiver aberta
  }
}