export default function App() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-4xl">Juliete</h1>
      <p className="text-sm tracking-widest text-rose">BOLOS CASEIROS</p>

      <div className="mt-6 rounded-2xl bg-bege p-5">
        <h2 className="text-2xl">Bolo de Forma 20 cm</h2>
        <p className="mt-1 text-sm">
          Bolo caseiro de forma, serve de 10 a 12 fatias
        </p>
        <p className="mt-3 text-xl font-semibold text-caramelo-escuro">
          a partir de R$ 60,00
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button className="rounded-full bg-caramelo-escuro px-5 py-2 font-semibold text-white">
            Adicionar
          </button>
          <span className="rounded-full bg-sucesso px-3 py-1 text-xs text-white">
            Disponível
          </span>
        </div>
      </div>
    </main>
  )
}