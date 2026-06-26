// Detalle de una maquina: historial de fallas, ultimas fallas, tiempo
// acumulado detenido, mecanicos que la atendieron, frecuencia/reincidencia y
// alerta de "maquina critica / recomendar mantenimiento mayor".
import { useMemo } from 'react'
import { where } from 'firebase/firestore'
import { incidenciasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { ESTADO_INCIDENCIA, LABEL_ESTADO, COLOR_ESTADO } from '../constants/estados'
import { aDate, fechaHora, formatoMinutos } from '../utils/tiempo'

export default function MaquinaDetalle({ maquina, onCerrar }) {
  // Incidencias de esta maquina (sin orderBy para no exigir indice compuesto).
  const { datos, cargando } = useColeccion(incidenciasRef, [
    where('maquina', '==', maquina.numero)
  ])

  const incidencias = useMemo(
    () =>
      [...datos].sort(
        (a, b) => (aDate(b.reportadaEn)?.getTime() ?? 0) - (aDate(a.reportadaEn)?.getTime() ?? 0)
      ),
    [datos]
  )

  const cerradas = incidencias.filter((i) => i.estado === ESTADO_INCIDENCIA.CERRADA)

  // Tiempo acumulado detenido: usa el acumulado de la maquina y, de respaldo,
  // suma los tiempos muertos de las incidencias cerradas.
  const minutosDetenida =
    maquina.minutosDetenida ||
    cerradas.reduce((s, i) => s + (i.tiempoMuertoMin ?? 0), 0)

  // Mecanicos que la atendieron (frecuencia por mecanico).
  const porMecanico = useMemo(() => {
    const m = {}
    for (const i of cerradas) {
      if (i.mecanicoNombre) m[i.mecanicoNombre] = (m[i.mecanicoNombre] ?? 0) + 1
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [cerradas])

  const totalFallas = maquina.fallasHistoricas ?? incidencias.length
  const esCritica = maquina.criticidad >= 0.8 || totalFallas >= 20

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h2>Maquina MQ {maquina.numero}</h2>
          <button className="btn-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        {esCritica && (
          <div className="alerta-critica">
            ⚠️ Maquina critica — se recomienda <strong>mantenimiento mayor</strong>.
            Alta reincidencia historica.
          </div>
        )}

        <div className="detalle-kpis">
          <div className="kpi">
            <span className="kpi-num">{totalFallas}</span>
            <span className="kpi-lbl">Fallas (histor.)</span>
          </div>
          <div className="kpi">
            <span className="kpi-num">{formatoMinutos(minutosDetenida)}</span>
            <span className="kpi-lbl">Tiempo detenida</span>
          </div>
          <div className="kpi">
            <span className="kpi-num">{Math.round((maquina.criticidad ?? 0) * 100)}%</span>
            <span className="kpi-lbl">Criticidad</span>
          </div>
          <div className="kpi">
            <span
              className="kpi-num"
              style={{ color: COLOR_ESTADO[maquina.estado] }}
            >
              {LABEL_ESTADO[maquina.estado]}
            </span>
            <span className="kpi-lbl">Estado actual</span>
          </div>
        </div>

        {porMecanico.length > 0 && (
          <div className="detalle-seccion">
            <h3>Mecanicos que la atendieron</h3>
            <div className="chips">
              {porMecanico.map(([nombre, n]) => (
                <span key={nombre} className="chip">{nombre} · {n}</span>
              ))}
            </div>
          </div>
        )}

        <div className="detalle-seccion">
          <h3>Ultimas fallas</h3>
          {cargando && <p>Cargando historial...</p>}
          {!cargando && incidencias.length === 0 && (
            <p className="texto-suave">Sin incidencias registradas en el sistema todavia.</p>
          )}
          <ul className="lista-historial">
            {incidencias.slice(0, 10).map((i) => (
              <li key={i.id}>
                <span className="hist-fecha">{fechaHora(i.reportadaEn)}</span>
                <span className="hist-falla">
                  {i.tipoFalla?.falla || i.descripcion || '—'}
                </span>
                <span className="hist-estado">{LABEL_ESTADO_INC(i.estado)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function LABEL_ESTADO_INC(estado) {
  const map = {
    reportada: 'Reportada',
    priorizada: 'En cola',
    atendiendo: 'En atencion',
    cerrada: 'Cerrada'
  }
  return map[estado] ?? estado
}
