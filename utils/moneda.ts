/**
 * Utilidades para formateo de montos en pesos colombianos.
 * Agrega puntos de miles mientras el usuario escribe.
 */

/** Formatea un string numérico con puntos de miles (ej: 1500000 → 1.500.000) */
export function formatearMontoInput(valor: string): string {
  // Remover todo excepto dígitos
  const soloDigitos = valor.replace(/\D/g, '');
  if (!soloDigitos) return '';
  // Agregar puntos de miles
  return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Extrae el valor numérico de un string formateado (ej: "1.500.000" → 1500000) */
export function limpiarMonto(valor: string): string {
  return valor.replace(/\./g, '');
}
