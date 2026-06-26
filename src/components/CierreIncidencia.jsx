// Modal de cierre de una incidencia (mecanico):
// corrobora/reclasifica el tipo de falla real + causa raiz + solucion +
// refacciones. Los tiempos los calcula el sistema al guardar.
import { useState } from 'react'
import SelectorFalla from './SelectorFalla'
import { cerrarIncidencia } from '../services/incidencias'
import { formatoMinutos, minutosDesde } from '../utils/tiempo'

export default function CierreIncidencia({ incidencia, onCerrar, onListo }) {
  const [tipoFalla, setTipoFalla] = useState(incidencia.tipoFalla ?? null)
  const [causaRaiz, setCausaRaiz] = useState('')
  const [solucion, setSolucion] = useState('')
  const [refacciones, setRefacciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const reparacionAprox = minutosDesde(incidencia.aceptadaEn)
  const puedeGuardar = tipoFalla && solucion.trim().length >= 3 && !guardando

  const onGuardar = async (e) => {
    e.preventDefault()
    if (!puedeGuardar) return
    setGuardando(true)
    setError('')
    try {
      await cerrarIncidencia({
        id: incidencia.id,
        tipoFalla,
        causaRaiz,
        solucion,
        refacciones
      })
      onListo?.()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo cerrar. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={onGuardar}>
        <div className="modal-cabecera">
          <h2>Cerrar · MQ {incidencia.maquina}</h2>
          <button type="button" className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>

        <p className="texto-suave" style={{ marginTop: 0 }}>
          Lo reportado: <em>"{incidencia.descripcion}"</em>
        </p>

        <label className="campo">
          <span>Tipo de falla real (catalogo)</span>
          <SelectorFalla valor={tipoFalla} onChange={setTipoFalla} />
        </label>

        {tipoFalla && (
          <p className="texto-suave" style={{ marginTop: -6 }}>
            Tiempo estandar: {tipoFalla.minEstandar} min ·
            llevas {formatoMinutos(reparacionAprox)} en esta reparacion.
          </p>
        )}

        <label className="campo">
          <span>Causa raiz</span>
          <input
            type="text"
            value={causaRaiz}
            onChange={(e) => setCausaRaiz(e.target.value)}
            placeholder="Por que paso"
          />
        </label>

        <label className="campo">
          <span>Solucion aplicada *</span>
          <textarea
            className="textarea-grande"
            rows={2}
            value={solucion}
            onChange={(e) => setSolucion(e.target.value)}
            placeholder="Que hiciste para repararla"
          />
        </label>

        <label className="campo">
          <span>Refacciones usadas</span>
          <input
            type="text"
            value={refacciones}
            onChange={(e) => setRefacciones(e.target.value)}
            placeholder="Ej. 12 agujas, 1 platina"
          />
        </label>

        {error && <div className="alerta-error">{error}</div>}

        <button className="btn-primario btn-grande" type="submit" disabled={!puedeGuardar}>
          {guardando ? 'Guardando...' : 'Cerrar incidencia'}
        </button>
      </form>
    </div>
  )
}
