import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TesteBanco() {
  const [categorias, setCategorias] = useState<Record<string, unknown>[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false

    supabase
      .from('categories')
      .select('*')
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
    <section className="rounded-2xl border border-border bg-card p-5">
      <h1 className="text-2xl">Teste: categorias do banco dev</h1>
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
  )
}