export function formatMoney(value: number): string {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("es-AR");
}
