// Panel del supervisor: priorizacion (asignar urgencia) y seguimiento.
// El supervisor SOLO elige urgencia (alta/media/baja); el sistema escala la
// prioridad solo combinando urgencia + criticidad + espera.
import { useMemo, useState } from 'react'
import { where, orderBy } from 'firebase/firestore'
import { incidenciasRef, maquinasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { useReloj } from '../hooks/useReloj'
import { ordenarPorPrioridad } from '../utils/prioridad'
import { priorizarIncidencia } from '../services/incidencias'
import { ESTADO_INCIDENCIA, URGENCIA, LABEL_URGENCIA, LABEL_INCIDENCIA } from '../constants/estados'
import { formatoMinutos, minutosDesde, horaCorta } from '../utils/tiempo'

export default function PanelIncidencias() {
  const ahora = useReloj()
  const [error, setError] = useState('')

  // Sin priorizar todavia.
  const { datos: porPriorizar } = useColeccion(incidenciasRef, [
    where('estado', '==', ESTADO_INCIDENCIA.REPORTADA)
  ])
  // En cola o en atencion.
  const { datos: enCurso } = useColeccion(incidenciasRef, [
    where('estado', 'in', [ESTADO_INCIDENCIA.PRIORIZADA, ESTADO_INCIDENCIA.ATENDIENDO])
  ])
  const { datos: maquinas } = useColeccion(maquinasRef, [orderBy('numero')])

  const maquinasPorNumero = useMemo(() => {
    const m = {}
    for (const mq of maquinas) m[mq.numero] = mq
    return m
  }, [maquinas])

  const pendientes = useMemo(
    () => ordenarPorPrioridad(porPriorizar, maquinasPorNumero, ahora),
    [porPriorizar, maquinasPorNumero, ahora]
  )
  const curso = useMemo(
    () => ordenarPorPrioridad(enCurso, maquinasPorNumero, ahora),
    [enCurso, maquinasPorNumero, ahora]
  )

  const asignar = async (id, urgencia) => {
    setError('')
    try {
      await priorizarIncidencia(id, urgencia)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error && <div className="alerta-error">{error}</div>}

      <h2 className="seccion-titulo">Por priorizar ({pendientes.length})</h2>
      {pendientes.length === 0 && (
        <div className="tarjeta"><p className="texto-suave">Nada por priorizar.</p></div>
      )}
      {pendientes.map((inc) => (
        <div key={inc.id} className="tarjeta-incidencia">
          <div className="ti-cabecera">
            <span className="ti-maquina">MQ {inc.maquina}</span>
            {(maquinasPorNumero[inc.maquina]?.criticidad ?? 0) >= 0.8 && (
              <span className="badge badge-critica">Critica</span>
            )}
            <span className="ti-meta" style={{ marginLeft: 'auto' }}>
              {inc.folio} · esperando {formatoMinutos(minutosDesde(inc.reportadaEn, ahora))}
            </span>
          </div>
          <p className="ti-desc">"{inc.descripcion}"</p>
          <div className="botones-urgencia">
            <button className="btn-urg urg-alta" onClick={() => asignar(inc.id, URGENCIA.ALTA)}>Alta</button>
            <button className="btn-urg urg-media" onClick={() => asignar(inc.id, URGENCIA.MEDIA)}>Media</button>
            <button className="btn-urg urg-baja" onClick={() => asignar(inc.id, URGENCIA.BAJA)}>Baja</button>
          </div>
        </div>
      ))}

      <h2 className="seccion-titulo" style={{ marginTop: 26 }}>En curso ({curso.length})</h2>
      {curso.length === 0 && (
        <div className="tarjeta"><p className="texto-suave">Sin incidencias en curso.</p></div>
      )}
      {curso.map((inc) => (
        <div key={inc.id} className="tarjeta-incidencia">
          <div className="ti-cabecera">
            <span className="ti-maquina">MQ {inc.maquina}</span>
            {inc.urgencia && (
              <span className={`badge urg-${inc.urgencia}`}>{LABEL_URGENCIA[inc.urgencia]}</span>
            )}
            <span className={`badge ${inc.estado === 'atendiendo' ? 'badge-amarillo' : 'badge-azul'}`}>
              {LABEL_INCIDENCIA[inc.estado]}
            </span>
            <span className="ti-meta" style={{ marginLeft: 'auto' }}>prioridad {inc._prioridad}</span>
          </div>
          <p className="ti-desc">"{inc.descripcion}"</p>
          <div className="ti-meta">
            Reportada {horaCorta(inc.reportadaEn)}
            {inc.mecanicoNombre && <> · atiende <strong>{inc.mecanicoNombre}</strong></>}
            {inc.aceptadaEn && <> desde {horaCorta(inc.aceptadaEn)}</>}
          </div>
        </div>
      ))}
    </div>
  )
}
