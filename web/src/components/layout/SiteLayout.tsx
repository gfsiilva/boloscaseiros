import { Link, NavLink, Outlet } from 'react-router'
import { ShoppingBag } from 'lucide-react'

const classeDoLink = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'font-semibold text-caramelo-escuro'
    : 'text-marrom-suave hover:text-marrom'

export default function SiteLayout() {
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

          <nav className="flex items-center gap-5 text-sm">
            <NavLink to="/cardapio" className={classeDoLink}>
              Cardápio
            </NavLink>
            <NavLink to="/carrinho" className={classeDoLink} aria-label="Carrinho">
              <ShoppingBag className="size-5" />
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