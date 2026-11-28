// TEMPORARIO: depois estes dados vao para o banco (business_settings),
// para a dona editar sem mexer no codigo.
// Numero: 55 + DDD + numero, so digitos (ex.: 5561999998888).
export const NUMERO_WHATSAPP = '5561999998888'
export const NOME_LOJA = 'Juliete Bolos Caseiros'

export function numeroWhatsappValido(): boolean {
  return /^55\d{10,11}$/.test(NUMERO_WHATSAPP)
}