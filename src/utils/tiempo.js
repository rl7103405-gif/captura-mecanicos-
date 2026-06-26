// Utilidades de tiempo: formateo y diferencias en minutos.

// Convierte un Timestamp de Firestore (o Date) a Date.
export function aDate(ts) {
  if (!ts) return null
  if (ts instanceof Date) return ts
  if (typeof ts.toDate === 'function') return ts.toDate()
  return new Date(ts)
}

// Diferencia en minutos entre dos timestamps (b - a). null si falta alguno.
export function minutosEntre(a, b) {
  const da = aDate(a)
  const db = aDate(b)
  if (!da || !db) return null
  return Math.round((db.getTime() - da.getTime()) / 60000)
}

// Minutos transcurridos desde un timestamp hasta ahora.
export function minutosDesde(ts, ahora = new Date()) {
  const d = aDate(ts)
  if (!d) return 0
  return Math.max(0, Math.round((ahora.getTime() - d.getTime()) / 60000))
}

// Formatea minutos como "1h 20m" / "45m".
export function formatoMinutos(min) {
  if (min == null) return '—'
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

// Hora corta local "14:30".
export function horaCorta(ts) {
  const d = aDate(ts)
  if (!d) return '—'
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

// Fecha + hora "12 jun, 14:30".
export function fechaHora(ts) {
  const d = aDate(ts)
  if (!d) return '—'
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
