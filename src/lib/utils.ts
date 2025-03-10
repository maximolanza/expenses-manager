import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse, isValid, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Funciones para manejo normalizado de fechas en toda la aplicación
 */

/**
 * Normaliza una fecha para evitar problemas de zona horaria
 * Ajusta la hora a mediodía (12:00:00) para evitar problemas con UTC
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(12, 0, 0, 0)
  return normalized
}

/**
 * Obtiene la fecha actual normalizada (con hora 12:00)
 */
export function getTodayNormalized(): Date {
  return normalizeDate(new Date())
}

/**
 * Convierte una fecha a string en formato ISO (YYYY-MM-DD)
 */
export function dateToISOString(date: Date): string {
  return format(normalizeDate(date), 'yyyy-MM-dd')
}

/**
 * Convierte un string ISO (YYYY-MM-DD) a un objeto Date normalizado
 */
export function isoStringToDate(dateString: string): Date {
  // Asegurar que la fecha tenga el formato correcto agregando la hora mediodía
  const date = new Date(`${dateString}T12:00:00`)
  return normalizeDate(date)
}

/**
 * Formatea una fecha para mostrarla al usuario
 * Ejemplos: "Hoy", "Ayer", "4 de marzo de 2025"
 */
export function formatDateForDisplay(dateString: string): string {
  const date = isoStringToDate(dateString)
  const today = getTodayNormalized()
  const yesterday = normalizeDate(subDays(today, 1))
  
  if (dateToISOString(date) === dateToISOString(today)) {
    return "Hoy"
  } else if (dateToISOString(date) === dateToISOString(yesterday)) {
    return "Ayer"
  } else {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
  }
}

/**
 * Obtiene el día anterior a una fecha dada
 */
export function getPreviousDay(dateString: string): string {
  const date = isoStringToDate(dateString)
  const previousDay = subDays(date, 1)
  return dateToISOString(previousDay)
}

/**
 * Obtiene el día siguiente a una fecha dada
 */
export function getNextDay(dateString: string): string {
  const date = isoStringToDate(dateString)
  const nextDay = addDays(date, 1)
  return dateToISOString(nextDay)
}
