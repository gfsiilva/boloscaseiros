import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router'
import { entradaCentavos, totalCentavos } from '@/lib/carrinho'
import { esquemaCliente, type DadosCliente } from '@/lib/cliente'
import { formatarReais } from '@/lib/dinheiro'
import { useCarrinho } from '@/lib/useCarrinho'

// Date.UTC evita a armadilha de fuso: new Date("2026-11-30") mostraria o dia anterior no Brasil
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(ano, mes - 1, dia)))
}

const campo =
  'mt-1 block min-h-12 w-full rounded-xl border border-bege bg-white px-4 text-base text-marrom placeholder:text-marrom-suave/60 focus:border-caramelo focus:outline-none focus:ring-2 focus:ring-caramelo/30'

export default function Dados() {
  const navigate = useNavigate()
  const { itens, retirada, cliente, definirCliente } = useCarrinho()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DadosCliente>({
    resolver: zodResolver(esquemaCliente),
    defaultValues: { nome: cliente?.nome ?? '', telefone: cliente?.telefone ?? '' },
  })

  // Sem carrinho ou sem horario nao ha o que fazer aqui: volta para o passo certo
  if (itens.length === 0) return <Navigate to="/carrinho" replace />
  if (!retirada) return <Navigate to="/agendamento" replace />

  const total = totalCentavos(itens)
  const entrada = entradaCentavos(total)

  function aoEnviar(dados: DadosCliente) {
    definirCliente({ nome: dados.nome, telefone: dados.telefone })
    navigate('/revisao')
  }

  return (
    <form
      onSubmit={handleSubmit(aoEnviar)}
      noValidate
      className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <div className="lg:col-start-1 lg:row-start-1">
        <h1 className="text-3xl">Seus dados</h1>
        <p className="mt-2 text-marrom-suave">
          Só precisamos do seu nome e telefone para combinar tudo pelo WhatsApp.
        </p>
      </div>

      <div className="space-y-5 lg:col-start-1 lg:row-start-2">
        <div>
          <label htmlFor="nome" className="font-semibold text-marrom">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            aria-invalid={errors.nome ? true : undefined}
            aria-describedby={errors.nome ? 'erro-nome' : undefined}
            className={campo}
            {...register('nome')}
          />
          {errors.nome && (
            <p id="erro-nome" className="mt-1 text-sm text-red-700">
              {errors.nome.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="telefone" className="font-semibold text-marrom">
            Telefone (WhatsApp)
          </label>
          <input
            id="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(61) 99999-8888"
            aria-invalid={errors.telefone ? true : undefined}
            aria-describedby={errors.telefone ? 'erro-telefone' : 'ajuda-telefone'}
            className={campo}
            {...register('telefone')}
          />
          {errors.telefone ? (
            <p id="erro-telefone" className="mt-1 text-sm text-red-700">
              {errors.telefone.message}
            </p>
          ) : (
            <p id="ajuda-telefone" className="mt-1 text-sm text-marrom-suave">
              Com DDD. Usamos só para falar do seu pedido.
            </p>
          )}
        </div>
      </div>

      <aside className="rounded-2xl border border-bege bg-pessego p-5 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-xl">Resumo do pedido</h2>

        <ul className="mt-4 divide-y divide-bege">
          {itens.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-marrom">
                  {item.quantidade}× {[item.nomeProduto, item.tamanho].filter(Boolean).join(' ')}
                </p>
                {item.nomeSabor && (
                  <p className="text-sm text-marrom-suave">Sabor: {item.nomeSabor}</p>
                )}
              </div>
              <p className="shrink-0 text-marrom">
                {formatarReais(item.precoUnitarioCentavos * item.quantidade)}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-sm text-marrom-suave">
          Retirada: {formatarData(retirada.data)} às {retirada.hora}
        </p>

        <dl className="mt-4 space-y-1 border-t border-bege pt-4 text-marrom">
          <div className="flex justify-between">
            <dt>Total</dt>
            <dd className="font-semibold">{formatarReais(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Entrada (50%)</dt>
            <dd>{formatarReais(entrada)}</dd>
          </div>
          <div className="flex justify-between text-marrom-suave">
            <dt>Saldo na retirada</dt>
            <dd>{formatarReais(total - entrada)}</dd>
          </div>
        </dl>
      </aside>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center lg:col-start-1 lg:row-start-3">
        <Link
          to="/agendamento"
          className="inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold text-marrom-suave hover:text-marrom"
        >
          Voltar
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-caramelo-escuro px-8 font-semibold text-white hover:opacity-90 sm:w-auto"
        >
          Continuar
        </button>
      </div>
    </form>
  )
}