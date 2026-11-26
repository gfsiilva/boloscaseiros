import { ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-4xl">Juliete</h1>
      <p className="text-sm tracking-widest text-rose">BOLOS CASEIROS</p>

      <div className="mt-6 rounded-2xl bg-secondary p-5">
        <h2 className="text-2xl">Bolo de Forma 20 cm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bolo caseiro de forma, serve de 10 a 12 fatias
        </p>
        <p className="mt-3 text-xl font-semibold text-primary">
          a partir de R$ 60,00
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Button size="lg">
            <ShoppingBag data-icon="inline-start" />
            Adicionar
          </Button>
          <span className="rounded-full bg-sucesso px-3 py-1 text-xs text-white">
            Disponível
          </span>
        </div>
      </div>

      {/* Fileira temporaria: so para ver as variacoes do Button com a paleta */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button>Padrão</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="outline">Contorno</Button>
        <Button variant="ghost">Fantasma</Button>
      </div>
    </main>
  )
}