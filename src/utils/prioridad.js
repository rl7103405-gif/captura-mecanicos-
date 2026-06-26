// Calculo de prioridad automatica de la cola de mecanicos.
//
// La prioridad NO la fija el supervisor a mano: el supervisor solo elige
// urgencia (alta/media/baja) y el sistema la escala combinando:
//   - nivel de urgencia (peso base)
//   - criticidad de la maquina (su reincidencia historica)
//   - tiempo que lleva esperando (sube sola mientras espera)
//
// Asi, una maquina critica que lleva mucho parada sube sola en la cola.
import { PESO_URGENCIA } from '../constants/estados'
import { minutosDesde } from './tiempo'

// criticidad esperada en 0..1 (1 = muy critica). Si no hay dato, 0.
// El factor multiplica el peso base de urgencia.
function factorCriticidad(criticidad = 0) {
  return 1 + Number(criticidad || 0) // 0 -> x1, 1 -> x2
}

// Puntos por espera: cada minuto esperando suma; capamos para no desbordar.
function puntosEspera(minutos) {
  return Math.min(minutos * 1.5, 600) // ~ tope a las 6-7 h de espera
}

// Devuelve un numero; mayor = mas prioritaria.
export function calcularPrioridad(incidencia, maquina, ahora = new Date()) {
  const base = PESO_URGENCIA[incidencia.urgencia] ?? PESO_URGENCIA.media
  const crit = factorCriticidad(maquina?.criticidad)
  // El tiempo de espera cuenta desde que se reporto.
  const espera = puntosEspera(minutosDesde(incidencia.reportadaEn, ahora))
  return Math.round(base * crit + espera)
}

// Ordena una lista de incidencias (con su maquina adjunta) por prioridad desc.
// Recibe un mapa numero->maquina para resolver criticidad.
export function ordenarPorPrioridad(incidencias, maquinasPorNumero, ahora = new Date()) {
  return [...incidencias]
    .map((inc) => ({
      ...inc,
      _prioridad: calcularPrioridad(inc, maquinasPorNumero?.[inc.maquina], ahora)
    }))
    .sort((a, b) => b._prioridad - a._prioridad)
}
