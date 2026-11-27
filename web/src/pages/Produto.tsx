import { useParams } from 'react-router'

export default function Produto() {
  const { id } = useParams()

  return (
    <section>
      <h1 className="text-3xl">Produto</h1>
      <p className="mt-2 text-marrom-suave">
        Aqui entram foto, tamanho, sabor e observações.
      </p>
      <p className="mt-2 text-sm">Id do produto na URL: {id}</p>
    </section>
  )
}