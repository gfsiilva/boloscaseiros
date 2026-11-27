import { Link } from 'react-router'
import { formatarReais } from '@/lib/dinheiro'
import type { CartaoDoCardapio } from '@/lib/tipos'

export default function CartaoProduto({ cartao }: { cartao: CartaoDoCardapio }) {
  const variosTamanhos = cartao.tamanhos.length > 1

  return (
    <Link
      to={`/produto/${cartao.idDoLink}`}
      className="flex overflow-hidden rounded-2xl bg-secondary transition hover:shadow-md sm:flex-col"
    >
      <div className="flex w-28 shrink-0 items-center justify-center bg-muted text-center text-xs text-muted-foreground sm:aspect-[4/3] sm:w-full sm:text-sm">
        Foto em breve
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {cartao.prontaEntrega && (
            <span className="rounded-full bg-sucesso px-2.5 py-0.5 text-xs text-white">
              Pronta entrega
            </span>
          )}
          {cartao.encomenda && (
            <span className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
              Sob encomenda
            </span>
          )}
        </div>

        <h2 className="mt-2 text-lg sm:text-xl">{cartao.nome}</h2>

        {cartao.descricao && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {cartao.descricao}
          </p>
        )}

        {variosTamanhos && (
          <p className="mt-1 text-xs text-muted-foreground">
            Tamanhos: {cartao.tamanhos.join(' · ')}
          </p>
        )}

        <p className="mt-auto pt-2 text-base font-semibold text-primary sm:text-lg">
          {variosTamanhos || !cartao.prontaEntrega ? 'a partir de ' : ''}
          {formatarReais(cartao.precoAPartirDe)}
        </p>
      </div>
    </Link>
  )
}