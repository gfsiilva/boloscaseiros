// Date.UTC evita a armadilha de fuso: new Date("2026-11-30") mostraria o dia anterior no Brasil
export function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(ano, mes - 1, dia)))
}