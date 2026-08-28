/** Fora do corpo de um componente para não disparar a regra de pureza do React. */
export function daysUntil(dateIso: string): number {
  const target = new Date(`${dateIso}T00:00:00`);
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
