// Panel de ranking de mecanicos (indice justo ponderado).
import { useMemo } from 'react'
import { incidenciasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { calcularRanking } from '../utils/ranking'
import { formatoMinutos } from '../utils/tiempo'

const MEDALLAS = ['🥇', '🥈', '🥉']

export default function PanelRanking() {
  const { datos: incidencias, cargando } = useColeccion(incidenciasRef)
  const ranking = useMemo(() => calcularRanking(incidencias), [incidencias])

  if (cargando) return <div className="tarjeta">Cargando ranking...</div>

  if (!ranking.length) {
    return (
      <div className="tarjeta">
        <h2>Ranking de mecanicos</h2>
        <p className="texto-suave">
          Aun no hay incidencias cerradas para calcular el indice. Cuando los
          mecanicos cierren trabajos, el ranking aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="tarjeta" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Indice justo</h3>
        <p className="texto-suave" style={{ marginTop: 0 }}>
          Combina <strong>40%</strong> cumplimiento vs el estandar de cada falla,
          <strong> 30%</strong> baja reincidencia, <strong>20%</strong> tiempo de
          respuesta y <strong>10%</strong> carga. Cada reparacion se compara contra
          el estandar de su propia categoria, asi que atender fallas complejas
          (p.ej. cambios de cilindro) no perjudica el indice.
        </p>
      </div>

      {/* Podio */}
      <div className="podio">
        {ranking.slice(0, 3).map((m, i) => (
          <div key={m.nombre} className={`podio-item p${i + 1}`}>
            <div className="podio-medalla">{MEDALLAS[i]}</div>
            <div className="podio-nombre">{m.nombre}</div>
            <div className="podio-indice">{m.indice}</div>
            <div className="podio-lbl">indice</div>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Mecanico</th>
              <th>Indice</th>
              <th>Cumpl. 40%</th>
              <th>Reincid. 30%</th>
              <th>Resp. 20%</th>
              <th>Carga 10%</th>
              <th>Cierres</th>
              <th>Prom. resp.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((m, i) => (
              <tr key={m.nombre}>
                <td>{i + 1}</td>
                <td><strong>{m.nombre}</strong></td>
                <td><span className="indice-pill">{m.indice}</span></td>
                <td>{m.cumplimiento}%</td>
                <td>{m.reincScore}%</td>
                <td>{m.respScore}%</td>
                <td>{m.cargaScore}%</td>
                <td>{m.cierres}</td>
                <td>{m.respProm != null ? formatoMinutos(m.respProm) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
