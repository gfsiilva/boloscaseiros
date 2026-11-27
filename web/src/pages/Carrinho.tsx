import { Link } from 'react-router'
import { Minus, Plus } from 'lucide-react'
import { formatarReais } from '@/lib/dinheiro'
import { entradaCentavos, totalCentavos } from '@/lib/carrinho'
import { useCarrinho } from '@/lib/useCarrinho'

export default function Carrinho() {
  const { itens, alterarQuantidade, remover } = useCarrinho()

  if (itens.length === 0) {
    return (
      <section>
        <h1 className="text-3xl">Meu carrinho</h1>
        <p className="mt-2 text-muted-foreground">Seu carrinho está vazio.</p>
        <Link
          to="/cardapio"
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-primary-foreground transition hover:opacity-90"
        >
          Ver o cardápio
        </Link>
      </section>
    )
  }

  const total = totalCentavos(itens)
  const entrada = entradaCentavos(total)

  return (
    <section>
      <h1 className="text-3xl">Meu carrinho</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
        <ul className="space-y-3">
          {itens.map((item) => {
            const detalhes = [item.tamanho, item.nomeSabor].filter(Boolean).join(' · ')
            return (
              <li key={item.id} className="rounded-2xl bg-card p-4">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg">{item.nomeProduto}</h2>
                    {detalhes && <p className="text-sm text-muted-foreground">{detalhes}</p>}
                    {item.observacoes && (
                      <p className="mt-1 text-sm italic text-muted-foreground">
                        Obs.: {item.observacoes}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-semibold text-primary">
                    {formatarReais(item.precoUnitarioCentavos * item.quantidade)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-border">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      className="flex size-11 items-center justify-center disabled:opacity-40"
                      disabled={item.quantidade <= 1}
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center" aria-live="polite">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      className="flex size-11 items-center justify-center disabled:opacity-40"
                      disabled={item.quantidade >= item.maxPorPedido}
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="min-h-11 px-2 text-sm text-muted-foreground underline hover:text-foreground"
                    onClick={() => remover(item.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        <aside className="rounded-2xl bg-secondary p-5 md:sticky md:top-6">
          <h2 className="text-xl">Resumo</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Total</dt>
              <dd className="font-semibold">{formatarReais(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Entrada (50%)</dt>
              <dd className="font-semibold text-primary">{formatarReais(entrada)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Saldo na retirada</dt>
              <dd>{formatarReais(total - entrada)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-muted-foreground">
            A entrada de 50% confirma o seu pedido. Você combina o pagamento pelo WhatsApp.
          </p>

          <Link
            to="/agendamento"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition hover:opacity-90"
          >
            Continuar
          </Link>
          <Link
            to="/cardapio"
            className="mt-2 flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground underline"
          >
            Adicionar mais bolos
          </Link>
        </aside>
      </div>
    </section>
  )
}