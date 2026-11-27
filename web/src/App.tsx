import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function App() {
  const [categorias, setCategorias] = useState<Record<string, unknown>[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    supabase
      .from("categories")
      .select("*")
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setCategorias(data ?? [])
      })

    return () => {
      cancelado = true
    }
  }, [])

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

      {/* Bloco temporario: prova de que o site le o banco dev */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Teste: categorias do banco dev</h2>
        {erro && <p className="mt-2 text-sm text-destructive">Erro: {erro}</p>}
        {!erro && categorias === null && (
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        )}
        {categorias && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {categorias.length} categoria(s) encontrada(s)
            </p>
            <pre className="mt-2 overflow-x-auto text-xs">
              {JSON.stringify(categorias, null, 2)}
            </pre>
          </>
        )}
      </section>
    </main>
  )
}