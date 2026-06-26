// Home del Mecanico: cola de trabajo ordenada por prioridad calculada,
// aceptar incidencias y cerrarlas documentando la solucion.
import { useMemo, useState } from 'react'
import { where, orderBy } from 'firebase/firestore'
import Layout from '../components/Layout'
import CierreIncidencia from '../components/CierreIncidencia'
import { useAuth } from '../context/AuthContext'
import { incidenciasRef, maquinasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { useReloj } from '../hooks/useReloj'
import { ordenarPorPrioridad } from '../utils/prioridad'
import { aceptarIncidencia } from '../services/incidencias'
import { ESTADO_INCIDENCIA, LABEL_URGENCIA } from '../constants/estados'
import { formatoMinutos, minutosDesde, horaCorta } from '../utils/tiempo'

export default function MecanicoHome() {
  const { perfil } = useAuth()
  const ahora = useReloj()
  const [cerrando, setCerrando] = useState(null) // incidencia a cerrar
  const [tomando, setTomando] = useState(null) // id en proceso de aceptar
  const [error, setError] = useState('')

  // Cola: reportadas y priorizadas (sin tomar todavia).
  const { datos: pendientes } = useColeccion(incidenciasRef, [
    where('estado', 'in', [ESTADO_INCIDENCIA.REPORTADA, ESTADO_INCIDENCIA.PRIORIZADA])
  ])
  // En atencion (filtramos por mi en cliente para no exigir indice compuesto).
  const { datos: atendiendo } = useColeccion(incidenciasRef, [
    where('estado', '==', ESTADO_INCIDENCIA.ATENDIENDO)
  ])
  const { datos: maquinas } = useColeccion(maquinasRef, [orderBy('numero')])

  const maquinasPorNumero = useMemo(() => {
    const m = {}
    for (const mq of maquinas) m[mq.numero] = mq
    return m
  }, [maquinas])

  const cola = useMemo(
    () => ordenarPorPrioridad(pendientes, maquinasPorNumero, ahora),
    [pendientes, maquinasPorNumero, ahora]
  )

  const misActivas = useMemo(
    () => atendiendo.filter((i) => i.mecanicoId === (perfil?.id ?? perfil?.uid)),
    [atendiendo, perfil]
  )

  const onAceptar = async (inc) => {
    setTomando(inc.id)
    setError('')
    try {
      await aceptarIncidencia({ id: inc.id, mecanico: perfil })
    } catch (err) {
      setError(err.message)
    } finally {
      setTomando(null)
    }
  }

  return (
    <Layout titulo="Mi cola de trabajo">
      {error && <div className="alerta-error">{error}</div>}

      {/* En atencion por mi */}
      {misActivas.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <h2 className="seccion-titulo">En atencion ({misActivas.length})</h2>
          {misActivas.map((inc) => (
            <div key={inc.id} className="tarjeta-incidencia atendiendo">
              <div className="ti-cabecera">
                <span className="ti-maquina">MQ {inc.maquina}</span>
                <span className="badge badge-amarillo">En atencion</span>
              </div>
              <p className="ti-desc">"{inc.descripcion}"</p>
              <div className="ti-meta">
                Aceptada {horaCorta(inc.aceptadaEn)} · llevas{' '}
                {formatoMinutos(minutosDesde(inc.aceptadaEn, ahora))}
              </div>
              <button className="btn-primario btn-grande" onClick={() => setCerrando(inc)}>
                Clasificar y cerrar
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Cola priorizada */}
      <section>
        <h2 className="seccion-titulo">Cola ({cola.length})</h2>
        {cola.length === 0 && (
          <div className="tarjeta">
            <p className="texto-suave">No hay incidencias pendientes. Buen trabajo.</p>
          </div>
        )}
        {cola.map((inc, idx) => {
          const maq = maquinasPorNumero[inc.maquina]
          const critica = (maq?.criticidad ?? 0) >= 0.8
          return (
            <div key={inc.id} className="tarjeta-incidencia">
              <div className="ti-cabecera">
                <span className="ti-orden">#{idx + 1}</span>
                <span className="ti-maquina">MQ {inc.maquina}</span>
                {inc.urgencia && (
                  <span className={`badge urg-${inc.urgencia}`}>
                    {LABEL_URGENCIA[inc.urgencia]}
                  </span>
                )}
                {!inc.urgencia && <span className="badge badge-gris">Sin priorizar</span>}
                {critica && <span className="badge badge-critica">Critica</span>}
              </div>
              <p className="ti-desc">"{inc.descripcion}"</p>
              <div className="ti-meta">
                Reportada {horaCorta(inc.reportadaEn)} · esperando{' '}
                {formatoMinutos(minutosDesde(inc.reportadaEn, ahora))} · prioridad{' '}
                <strong>{inc._prioridad}</strong>
              </div>
              <button
                className="btn-primario btn-grande"
                onClick={() => onAceptar(inc)}
                disabled={tomando === inc.id}
              >
                {tomando === inc.id ? 'Tomando...' : 'Aceptar'}
              </button>
            </div>
          )
        })}
      </section>

      {cerrando && (
        <CierreIncidencia
          incidencia={cerrando}
          onCerrar={() => setCerrando(null)}
          onListo={() => setCerrando(null)}
        />
      )}
    </Layout>
  )
}
