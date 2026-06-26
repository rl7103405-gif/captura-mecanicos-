// Servicio del flujo de incidencias (4 etapas con timestamps automaticos).
//
//   1) Reporte     (tejedor)    -> reportadaEn  · maquina ROJA
//   2) Priorizacion (supervisor) -> urgencia
//   3) Atencion    (mecanico)   -> aceptadaEn   · maquina AMARILLA
//   4) Cierre      (mecanico)   -> cerradaEn    · maquina VERDE
//
// Al cerrar, el sistema calcula SOLO (cero captura manual duplicada):
//   - tiempo de respuesta  = reporte   -> aceptacion
//   - tiempo de reparacion = aceptacion -> cierre
//   - tiempo muerto total  = reporte   -> cierre
import {
  doc,
  runTransaction,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { incidenciasRef, incidenciaDoc, maquinaDoc } from '../firebase/colecciones'
import { ESTADO_INCIDENCIA, ESTADO_MAQUINA } from '../constants/estados'
import { minutosEntre } from '../utils/tiempo'

const contadorDoc = doc(db, 'contadores', 'incidencias')

// 1) REPORTE (tejedor): elige maquina + descripcion + turno.
// Genera folio automatico y guarda la hora de reporte. La maquina pasa a roja.
export async function reportarIncidencia({ usuario, numeroMaquina, descripcion, turno }) {
  const numero = Number(numeroMaquina)
  return runTransaction(db, async (tx) => {
    const contadorSnap = await tx.get(contadorDoc)
    const maqRef = maquinaDoc(numero)
    const maqSnap = await tx.get(maqRef)
    if (!maqSnap.exists()) throw new Error(`La maquina ${numero} no existe.`)

    const n = (contadorSnap.data()?.ultimo ?? 0) + 1
    const folio = `INC-${String(n).padStart(5, '0')}`

    const nuevaRef = doc(incidenciasRef) // id automatico
    tx.set(nuevaRef, {
      folio,
      maquina: numero,
      estado: ESTADO_INCIDENCIA.REPORTADA,
      tejedorId: usuario?.id ?? usuario?.uid ?? null,
      tejedorNombre: usuario?.nombre ?? 'Tejedor',
      descripcion: descripcion?.trim() ?? '',
      turno: turno ?? null,
      urgencia: null,
      prioridadCalculada: null,
      mecanicoId: null,
      mecanicoNombre: null,
      tipoFalla: null,
      causaRaiz: null,
      solucion: null,
      refacciones: null,
      reportadaEn: serverTimestamp(),
      aceptadaEn: null,
      cerradaEn: null,
      tiempoRespuestaMin: null,
      tiempoReparacionMin: null,
      tiempoMuertoMin: null
    })

    tx.set(contadorDoc, { ultimo: n }, { merge: true })

    tx.update(maqRef, {
      estado: ESTADO_MAQUINA.REPORTADA,
      incidenciaActiva: nuevaRef.id,
      totalFallas: increment(1),
      ultimaFalla: serverTimestamp()
    })

    return { id: nuevaRef.id, folio }
  })
}

// 2) PRIORIZACION (supervisor): asigna urgencia (alta/media/baja).
export async function priorizarIncidencia(id, urgencia) {
  await updateDoc(incidenciaDoc(id), {
    urgencia,
    estado: ESTADO_INCIDENCIA.PRIORIZADA
  })
}

// 3) ATENCION (mecanico): acepta -> guarda hora de aceptacion. Maquina amarilla.
export async function aceptarIncidencia({ id, mecanico }) {
  return runTransaction(db, async (tx) => {
    const incRef = incidenciaDoc(id)
    const incSnap = await tx.get(incRef)
    if (!incSnap.exists()) throw new Error('La incidencia ya no existe.')
    const inc = incSnap.data()
    if (inc.estado === ESTADO_INCIDENCIA.ATENDIENDO || inc.estado === ESTADO_INCIDENCIA.CERRADA) {
      throw new Error('Esta incidencia ya fue tomada por otro mecanico.')
    }
    const maqRef = maquinaDoc(inc.maquina)

    tx.update(incRef, {
      estado: ESTADO_INCIDENCIA.ATENDIENDO,
      mecanicoId: mecanico?.id ?? mecanico?.uid ?? null,
      mecanicoNombre: mecanico?.nombre ?? 'Mecanico',
      aceptadaEn: serverTimestamp()
    })
    tx.update(maqRef, { estado: ESTADO_MAQUINA.ATENDIENDO })
  })
}

// El mecanico corrobora y reclasifica el tipo de falla real (catalogo estandar).
export async function reclasificarFalla(id, tipoFalla) {
  await updateDoc(incidenciaDoc(id), { tipoFalla })
}

// 4) CIERRE (mecanico): causa raiz + solucion + refacciones. Maquina verde.
// El sistema calcula los tiempos automaticamente.
export async function cerrarIncidencia({ id, tipoFalla, causaRaiz, solucion, refacciones }) {
  return runTransaction(db, async (tx) => {
    const incRef = incidenciaDoc(id)
    const incSnap = await tx.get(incRef)
    if (!incSnap.exists()) throw new Error('La incidencia ya no existe.')
    const inc = incSnap.data()
    const maqRef = maquinaDoc(inc.maquina)

    const ahora = Timestamp.now()
    // tiempo de respuesta solo existe si hubo reporte y aceptacion.
    const tiempoRespuestaMin = minutosEntre(inc.reportadaEn, inc.aceptadaEn)
    const tiempoReparacionMin = minutosEntre(inc.aceptadaEn, ahora)
    const tiempoMuertoMin = minutosEntre(inc.reportadaEn, ahora)

    tx.update(incRef, {
      estado: ESTADO_INCIDENCIA.CERRADA,
      tipoFalla: tipoFalla ?? inc.tipoFalla ?? null,
      causaRaiz: causaRaiz?.trim() ?? null,
      solucion: solucion?.trim() ?? null,
      refacciones: refacciones?.trim() ?? null,
      cerradaEn: serverTimestamp(),
      tiempoRespuestaMin,
      tiempoReparacionMin,
      tiempoMuertoMin
    })

    tx.update(maqRef, {
      estado: ESTADO_MAQUINA.OPERANDO,
      incidenciaActiva: null,
      minutosDetenida: increment(tiempoMuertoMin ?? 0)
    })
  })
}
