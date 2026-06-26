// Calculo de KPIs a partir de las incidencias (y maquinas).
import { aDate } from './tiempo'
import { ESTADO_INCIDENCIA } from '../constants/estados'

export function promedio(nums) {
  const v = nums.filter((n) => typeof n === 'number' && !isNaN(n))
  if (!v.length) return null
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

export function suma(nums) {
  return nums.reduce((a, b) => a + (Number(b) || 0), 0)
}

// Agrupa y cuenta por una clave.
export function contarPor(items, claveFn) {
  const m = {}
  for (const it of items) {
    const k = claveFn(it)
    if (k == null || k === '') continue
    m[k] = (m[k] ?? 0) + 1
  }
  return m
}

// Convierte un mapa {clave: valor} en lista ordenada desc, top N opcional.
export function aRankingDesc(mapa, top) {
  const lista = Object.entries(mapa)
    .map(([clave, valor]) => ({ clave, valor }))
    .sort((a, b) => b.valor - a.valor)
  return top ? lista.slice(0, top) : lista
}

// Clave de dia "2026-06-12".
export function claveDia(ts) {
  const d = aDate(ts)
  if (!d) return null
  return d.toISOString().slice(0, 10)
}

// Clave de mes "2026-06".
export function claveMes(ts) {
  const d = aDate(ts)
  if (!d) return null
  return d.toISOString().slice(0, 7)
}

// Resumen general de mantenimiento.
export function resumenMantenimiento(incidencias) {
  const cerradas = incidencias.filter((i) => i.estado === ESTADO_INCIDENCIA.CERRADA)
  const abiertas = incidencias.filter((i) => i.estado !== ESTADO_INCIDENCIA.CERRADA)

  return {
    total: incidencias.length,
    cerradas: cerradas.length,
    abiertas: abiertas.length,
    tiempoMuertoTotal: suma(cerradas.map((i) => i.tiempoMuertoMin)),
    promRespuesta: promedio(cerradas.map((i) => i.tiempoRespuestaMin)),
    promReparacion: promedio(cerradas.map((i) => i.tiempoReparacionMin)),
    cerradasLista: cerradas
  }
}

// Cumplimiento vs tiempo estandar por tipo de falla.
export function cumplimientoPorFalla(cerradas) {
  const grupos = {}
  for (const i of cerradas) {
    const nombre = i.tipoFalla?.falla
    if (!nombre || i.tiempoReparacionMin == null) continue
    grupos[nombre] ??= { nombre, real: [], estandar: i.tipoFalla.minEstandar }
    grupos[nombre].real.push(i.tiempoReparacionMin)
  }
  return Object.values(grupos)
    .map((g) => ({
      nombre: g.nombre,
      n: g.real.length,
      promReal: promedio(g.real),
      estandar: g.estandar,
      // % cumplimiento: estandar / real (>100% = mas rapido que el estandar)
      cumplimiento: g.estandar && promedio(g.real)
        ? Math.round((g.estandar / promedio(g.real)) * 100)
        : null
    }))
    .sort((a, b) => b.n - a.n)
}
