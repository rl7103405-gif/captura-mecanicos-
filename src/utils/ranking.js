// Ranking de mecanicos con un indice justo (ponderado), para comparar
// desempeno real SIN perjudicar al que toma los trabajos dificiles.
//
//   40% cumplimiento contra el tiempo estandar de CADA falla (no un promedio
//        general): cada reparacion se compara contra el estandar de su propia
//        categoria. Asi un cambio de cilindro (180 min) se juzga contra 180,
//        no contra el promedio. Esto normaliza a quien atiende lo complejo.
//   30% baja reincidencia de las maquinas que atendio (calidad: que no
//        vuelvan a fallar pronto despues de repararlas).
//   20% tiempo de respuesta (normalizado entre mecanicos).
//   10% carga de trabajo atendida (normalizado).
import { aDate } from './tiempo'
import { ESTADO_INCIDENCIA } from '../constants/estados'

const PESOS = { cumplimiento: 0.4, reincidencia: 0.3, respuesta: 0.2, carga: 0.1 }
const VENTANA_REINCIDENCIA_MS = 48 * 60 * 60 * 1000 // 48 h

// Eficiencia de una reparacion vs su estandar: 1 si cumplio o fue mas rapido,
// <1 si tardo mas. Cap en 1 para no premiar de mas por ir muy rapido.
function eficiencia(tiempoReal, estandar) {
  if (!estandar || tiempoReal == null || tiempoReal <= 0) return null
  return Math.min(estandar / tiempoReal, 1)
}

// Construye, por maquina, las horas de reporte ordenadas (para detectar
// reincidencias posteriores a un cierre).
function reportesPorMaquina(incidencias) {
  const m = {}
  for (const i of incidencias) {
    const t = aDate(i.reportadaEn)?.getTime()
    if (t == null) continue
    ;(m[i.maquina] ??= []).push(t)
  }
  for (const k of Object.keys(m)) m[k].sort((a, b) => a - b)
  return m
}

export function calcularRanking(incidencias) {
  const cerradas = incidencias.filter(
    (i) => i.estado === ESTADO_INCIDENCIA.CERRADA && i.mecanicoNombre
  )
  const reportes = reportesPorMaquina(incidencias)

  // Agrupar por mecanico y acumular metricas crudas.
  const porMec = {}
  for (const i of cerradas) {
    const id = i.mecanicoId || i.mecanicoNombre
    const g = (porMec[id] ??= {
      id,
      nombre: i.mecanicoNombre,
      efs: [],
      resp: [],
      cierres: 0,
      reincidencias: 0
    })
    g.cierres += 1

    const ef = eficiencia(i.tiempoReparacionMin, i.tipoFalla?.minEstandar)
    if (ef != null) g.efs.push(ef)

    if (typeof i.tiempoRespuestaMin === 'number') g.resp.push(i.tiempoRespuestaMin)

    // Reincidencia: la maquina volvio a reportarse dentro de 48 h del cierre.
    const cerr = aDate(i.cerradaEn)?.getTime()
    if (cerr != null) {
      const posteriores = (reportes[i.maquina] || []).filter(
        (t) => t > cerr && t <= cerr + VENTANA_REINCIDENCIA_MS
      )
      if (posteriores.length) g.reincidencias += 1
    }
  }

  const mecanicos = Object.values(porMec)
  if (!mecanicos.length) return []

  // Metricas por mecanico (crudas).
  for (const g of mecanicos) {
    g.cumplimiento = g.efs.length ? g.efs.reduce((a, b) => a + b, 0) / g.efs.length : 0
    g.reincScore = g.cierres ? 1 - g.reincidencias / g.cierres : 1
    g.respProm = g.resp.length ? g.resp.reduce((a, b) => a + b, 0) / g.resp.length : null
  }

  // Normalizaciones relativas entre mecanicos.
  const cargas = mecanicos.map((g) => g.cierres)
  const maxCarga = Math.max(...cargas)
  const resps = mecanicos.map((g) => g.respProm).filter((v) => v != null)
  const minResp = resps.length ? Math.min(...resps) : 0
  const maxResp = resps.length ? Math.max(...resps) : 0

  for (const g of mecanicos) {
    g.cargaScore = maxCarga ? g.cierres / maxCarga : 0
    // Respuesta: menor es mejor. Si no hay rango, neutral 0.5.
    if (g.respProm == null || maxResp === minResp) g.respScore = 0.5
    else g.respScore = 1 - (g.respProm - minResp) / (maxResp - minResp)

    g.indice = Math.round(
      100 *
        (PESOS.cumplimiento * g.cumplimiento +
          PESOS.reincidencia * g.reincScore +
          PESOS.respuesta * g.respScore +
          PESOS.carga * g.cargaScore)
    )
  }

  return mecanicos
    .map((g) => ({
      nombre: g.nombre,
      indice: g.indice,
      cierres: g.cierres,
      cumplimiento: Math.round(g.cumplimiento * 100),
      reincScore: Math.round(g.reincScore * 100),
      respScore: Math.round(g.respScore * 100),
      cargaScore: Math.round(g.cargaScore * 100),
      respProm: g.respProm != null ? Math.round(g.respProm) : null
    }))
    .sort((a, b) => b.indice - a.indice)
}
