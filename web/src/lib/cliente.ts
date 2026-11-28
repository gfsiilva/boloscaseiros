import { z } from 'zod'

export type Cliente = {
  nome: string
  telefone: string
}

// Mesma regra do create_order no banco:
// so digitos; com 12 ou mais digitos e comecando em 55, tira o 55.
export function normalizarTelefone(texto: string): string {
  const digitos = texto.replace(/\D/g, '')
  if (digitos.length >= 12 && digitos.startsWith('55')) return digitos.slice(2)
  return digitos
}

export function telefoneValido(texto: string): boolean {
  const tamanho = normalizarTelefone(texto).length
  return tamanho === 10 || tamanho === 11
}

// O "fiscal" do formulario. E so cortesia: quem garante e o create_order.
export const esquemaCliente = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe seu nome.')
    .max(100, 'O nome pode ter no máximo 100 caracteres.'),
  telefone: z.string().refine(telefoneValido, 'Informe um telefone válido com DDD.'),
})

export type DadosCliente = z.infer<typeof esquemaCliente>

const CHAVE_CLIENTE = 'juliete:cliente:v1'

export function lerCliente(): Cliente | null {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CLIENTE)
    if (!bruto) return null
    const c: unknown = JSON.parse(bruto)
    if (typeof c !== 'object' || c === null) return null
    const x = c as Record<string, unknown>
    if (typeof x.nome === 'string' && typeof x.telefone === 'string') {
      return { nome: x.nome, telefone: x.telefone }
    }
    return null
  } catch {
    return null
  }
}

export function salvarCliente(cliente: Cliente | null): void {
  try {
    if (cliente) window.localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(cliente))
    else window.localStorage.removeItem(CHAVE_CLIENTE)
  } catch {
    // sem armazenamento: vale so enquanto a aba estiver aberta
  }
}