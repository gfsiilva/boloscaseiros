import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useCarrinho } from '@/lib/useCarrinho'

type Horario = {
  slot_id: string
  time: string
  ok: boolean
  reason: string | null
}

type Dia = {
  date: string
  slots: Horario[]
}

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// Le "2026-11-30" sem passar pelo fuso do navegador (new Date("2026-11-30") mostraria o dia anterior)
function partesDaData(texto: string) {
  const [ano, mes, dia] = texto.split('-').map(Number)
  const semana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()
  return {
    semana: DIAS_DA_SEMANA[semana],
    diaMes: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`,
  }
}

function textoDoMotivo(codigo: string | null): string {
  switch (codigo) {
    case 'prazo':
      return 'Prazo insuficiente'
    case 'sem_pontos':
      return 'Sem vagas'
    case 'sem_estoque':
      return 'Esgotado'
    default:
      return 'Indisponível'
  }
}

export default function Agendamento() {
  const { itens, retirada, escolherRetirada } = useCarrinho()

  const [dias, setDias] = useState<Dia[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null)

  const corpo = useMemo(
    () =>
      JSON.stringify(
        itens.map((i) => ({
          product_id: i.produtoId,
          ...(i.saborId ? { flavor_id: i.saborId } : {}),
          quantity: i.quantidade,
        })),
      ),
    [itens],
  )

  useEffect(() => {
    const pedido = JSON.parse(corpo) as unknown[]
    if (pedido.length === 0) return

    let cancelado = false

    async function carregar() {
      const { data, error } = await supabase.rpc('available_pickup_options', {
        p_items: pedido,
      })
      if (cancelado) return
      if (error) {
        setErro(error.message)
        return
      }
      setErro(null)
      setDias(data as Dia[])
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [corpo])

  if (itens.length === 0) {
    return (
      <section>
        <h1 className="text-3xl">Agendamento</h1>
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

  if (erro) {
    return (
      <section>
        <h1 className="text-3xl">Agendamento</h1>
        <p className="mt-2 text-destructive">
          Não foi possível carregar os horários: {erro}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Se um bolo saiu do cardápio, volte ao{' '}
          <Link to="/carrinho" className="font-semibold text-primary underline">
            carrinho
          </Link>{' '}
          e remova-o.
        </p>
      </section>
    )
  }

  if (dias === null) {
    return <p className="text-muted-foreground">Carregando os horários...</p>
  }

  const primeiroComVaga = dias.find((d) => d.slots.some((s) => s.ok))?.date
  const diaAtivo = diaEscolhido ?? retirada?.data ?? primeiroComVaga ?? dias[0]?.date
  const horarios = dias.find((d) => d.date === diaAtivo)?.slots ?? []

  if (dias.length === 0) {
    return (
      <section>
        <h1 className="text-3xl">Agendamento</h1>
        <p className="mt-2 text-muted-foreground">
          Não há dias abertos para retirada no momento.
        </p>
      </section>
    )
  }

  return (
    <section>
      <Link to="/carrinho" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar ao carrinho
      </Link>
      <h1 className="mt-3 text-3xl">Agendamento</h1>
      <p className="mt-1 text-muted-foreground">Escolha o dia e o horário da retirada.</p>

      <h2 className="mt-6 text-sm font-semibold">Dia</h2>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Dia">
        {dias.map((d) => {
          const { semana, diaMes } = partesDaData(d.date)
          const temVaga = d.slots.some((s) => s.ok)
          const selecionado = d.date === diaAtivo
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={selecionado}
              onClick={() => setDiaEscolhido(d.date)}
              className={`flex min-h-14 w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition ${
                selecionado
                  ? 'border-primary bg-primary text-primary-foreground'
                  : temVaga
                    ? 'border-border bg-card hover:border-dourado'
                    : 'border-border bg-muted text-muted-foreground opacity-60'
              }`}
            >
              <span className="text-xs uppercase">{semana}</span>
              <span className="font-semibold">{diaMes}</span>
            </button>
          )
        })}
      </div>

      <h2 className="mt-6 text-sm font-semibold">Horário</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Horário">
        {horarios.map((h) => {
          const selecionado = retirada?.slotId === h.slot_id
          return (
            <button
              key={h.slot_id}
              type="button"
              disabled={!h.ok}
              aria-pressed={selecionado}
              onClick={() =>
                escolherRetirada({ slotId: h.slot_id, data: diaAtivo, hora: h.time })
              }
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm transition ${
                selecionado
                  ? 'border-primary bg-card ring-2 ring-primary'
                  : h.ok
                    ? 'border-border bg-card hover:border-dourado'
                    : 'border-border bg-muted text-muted-foreground opacity-60'
              }`}
            >
              <span className="font-semibold">{h.time}</span>
              {!h.ok && <span className="text-xs">{textoDoMotivo(h.reason)}</span>}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Os horários podem mudar conforme a nossa capacidade de produção. A vaga só fica
        reservada depois que você envia o pedido.
      </p>

      {retirada ? (
        <p className="mt-4 rounded-xl bg-muted p-3 text-sm">
          Retirada escolhida:{' '}
          <strong>
            {partesDaData(retirada.data).semana}, {partesDaData(retirada.data).diaMes} às{' '}
            {retirada.hora}
          </strong>
        </p>
      ) : null}

      {retirada ? (
        <Link
          to="/dados"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition hover:opacity-90 sm:max-w-xs"
        >
          Continuar
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-5 min-h-12 w-full rounded-full bg-primary px-6 text-primary-foreground opacity-50 sm:max-w-xs"
        >
          Escolha um horário
        </button>
      )}
    </section>
  )
}