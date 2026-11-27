import { Link, NavLink, Outlet } from 'react-router'
import { ShoppingBag } from 'lucide-react'
import { quantidadeTotal } from '@/lib/carrinho'
import { useCarrinho } from '@/lib/useCarrinho'

const classeDoLink = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'font-semibold text-caramelo-escuro'
    : 'text-marrom-suave hover:text-marrom'

export default function SiteLayout() {
  const { itens } = useCarrinho()
  const quantidade = quantidadeTotal(itens)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-bege bg-creme">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="leading-tight">
            <span className="block font-display text-2xl">Juliete</span>
            <span className="block text-[0.65rem] tracking-widest text-rose">
              BOLOS CASEIROS
            </span>
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <NavLink
              to="/cardapio"
              className={(estado) =>
                `flex min-h-11 items-center px-2 ${classeDoLink(estado)}`
              }
            >
              Cardápio
            </NavLink>
            <NavLink
              to="/carrinho"
              aria-label={
                quantidade > 0 ? `Carrinho, ${quantidade} item(ns)` : 'Carrinho'
              }
              className={(estado) =>
                `relative flex size-11 items-center justify-center ${classeDoLink(estado)}`
              }
            >
              <ShoppingBag className="size-5" />
              {quantidade > 0 && (
                <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] leading-4 text-primary-foreground">
                  {quantidade}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-pessego py-6 text-center text-sm text-marrom-suave">
        Bolos que transformam momentos em memórias
      </footer>
    </div>
  )
}