import { formatarDataCurta } from '@/lib/datas'
import { formatarReais } from '@/lib/dinheiro'
import { NOME_LOJA, NUMERO_WHATSAPP } from '@/lib/loja'
import { nomeDoItem, type PedidoEnviado } from '@/lib/pedido'

// Codigo curto derivado do id (sem mexer no banco): 6 caracteres em maiuscula
export function codigoCurto(orderId: string): string {
  return orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

export function montarMensagem(pedido: PedidoEnviado): string {
  const linhasItens = pedido.itens.map((i) => {
    const sabor = i.nomeSabor ? ` (${i.nomeSabor})` : ''
    const obs = i.observacoes !== '' ? ` - Obs.: ${i.observacoes}` : ''
    return `- ${i.quantidade}x ${nomeDoItem(i)}${sabor}${obs}`
  })

  return [
    `Olá! Fiz um pedido pelo site da ${NOME_LOJA}.`,
    '',
    `Pedido #${codigoCurto(pedido.orderId)}`,
    `Nome: ${pedido.nome}`,
    '',
    'Itens:',
    ...linhasItens,
    '',
    `Retirada: ${formatarDataCurta(pedido.data)} às ${pedido.hora}`,
    `Total: ${formatarReais(pedido.totalCentavos)}`,
    `Entrada (50%): ${formatarReais(pedido.entradaCentavos)}`,
    '',
    `Minha vaga fica reservada até as ${formatarHora(pedido.holdExpiraEm)}. Pode me passar o PIX da entrada?`,
  ].join('\n')
}

export function linkWhatsapp(pedido: PedidoEnviado): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(montarMensagem(pedido))}`
}