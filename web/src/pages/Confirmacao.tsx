import { useState } from 'react'
import { Check } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { formatarDataCurta } from '@/lib/datas'
import { formatarReais } from '@/lib/dinheiro'
import { numeroWhatsappValido } from '@/lib/loja'
import { lerPedidoEnviado, nomeDoItem } from '@/lib/pedido'
import { codigoCurto, formatarHora, linkWhatsapp } from '@/lib/whatsapp'

export default function Confirmacao() {
  // Le a copia do pedido uma vez; o F5 nao perde nada porque ela fica salva no navegador
  const [pedido] = useState(lerPedidoEnviado)

  if (!pedido) return <Navigate to="/" replace />

  const saldo = pedido.totalCentavos - pedido.entradaCentavos

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-sucesso text-white">
          <Check className="size-8" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-3xl">Pedido enviado!</h1>
        <p className="mt-2 text-marrom-suave">
          Seu pedido foi registrado e o horário fica reservado até as{' '}
          {formatarHora(pedido.holdExpiraEm)}. A loja vai confirmar a entrada de 50% pelo
          WhatsApp.
        </p>
      </div>

      <div className="rounded-2xl border border-bege bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-marrom-suave">Pedido</p>
            <p className="text-xl font-semibold text-marrom">#{codigoCurto(pedido.orderId)}</p>
          </div>
          <span className="rounded-full border border-caramelo/40 bg-pessego px-3 py-1 text-sm font-semibold text-marrom">
            Aguardando confirmação
          </span>
        </div>

        <ul className="mt-4 divide-y divide-bege border-t border-bege">
          {pedido.itens.map((item, indice) => (
            <li key={indice} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-marrom">
                  {item.quantidade}× {nomeDoItem(item)}
                </p>
                {item.nomeSabor && (
                  <p className="text-sm text-marrom-suave">Sabor: {item.nomeSabor}</p>
                )}
                {item.observacoes !== '' && (
                  <p className="break-words text-sm text-marrom-suave">Obs.: {item.observacoes}</p>
                )}
              </div>
              <p className="shrink-0 text-marrom">
                {formatarReais(item.precoUnitarioCentavos * item.quantidade)}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-t border-bege pt-4">
          <p className="text-sm text-marrom-suave">Retirada no local</p>
          <p className="text-marrom">
            {formatarDataCurta(pedido.data)} às {pedido.hora}
          </p>
        </div>

        <dl className="mt-4 space-y-1 border-t border-bege pt-4 text-marrom">
          <div className="flex justify-between">
            <dt>Total</dt>
            <dd className="font-semibold">{formatarReais(pedido.totalCentavos)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Entrada (50%)</dt>
            <dd className="font-semibold">{formatarReais(pedido.entradaCentavos)}</dd>
          </div>
          <div className="flex justify-between text-marrom-suave">
            <dt>Saldo na retirada</dt>
            <dd>{formatarReais(saldo)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        <Link
          to="/"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-caramelo-escuro px-8 font-semibold text-white hover:opacity-90"
        >
          Voltar para o início
        </Link>

        {numeroWhatsappValido() && (
          <p className="text-center text-sm text-marrom-suave">
            O WhatsApp não abriu?{' '}
            <a
              href={linkWhatsapp(pedido)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-caramelo-escuro underline underline-offset-2"
            >
              Toque aqui para enviar o pedido
            </a>
          </p>
        )}
      </div>
    </section>
  )
}