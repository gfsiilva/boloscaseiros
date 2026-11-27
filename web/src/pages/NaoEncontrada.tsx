import { Link } from 'react-router'

export default function NaoEncontrada() {
  return (
    <section>
      <h1 className="text-3xl">Página não encontrada</h1>
      <p className="mt-2 text-marrom-suave">
        Esse endereço não existe.{' '}
        <Link to="/" className="font-semibold text-caramelo-escuro underline">
          Voltar ao início
        </Link>
      </p>
    </section>
  )
}