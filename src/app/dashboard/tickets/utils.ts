/**
 * Normaliza un nombre de producto para comparaciones
 * - Elimina espacios en blanco al inicio y final
 * - Elimina signos de puntuación al final
 * - Convierte a minúsculas
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  
  // Eliminar espacios en blanco al inicio y final
  let normalized = name.trim();
  
  // Eliminar signos de puntuación al final (.,:;)
  normalized = normalized.replace(/[\.,:;]+$/, '');
  
  // Convertir a minúsculas
  return normalized.toLowerCase();
} 