// Tablero de las maquinas en una cuadricula, con estados por color en tiempo
// real. Al tocar una maquina abre su detalle.
import { useMemo, useState } from 'react'
import { orderBy } from 'firebase/firestore'
import { maquinasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { COLOR_ESTADO, LABEL_ESTADO } from '../constants/estados'
import MaquinaDetalle from './MaquinaDetalle'

const ESTADOS_LEYENDA = ['verde', 'rojo', 'amarillo', 'azul']

export default function TableroMaquinas() {
  const { datos: maquinas, cargando } = useColeccion(maquinasRef, [
    orderBy('numero')
  ])
  const [seleccion, setSeleccion] = useState(null)

  const conteo = useMemo(() => {
    const c = { verde: 0, rojo: 0, amarillo: 0, azul: 0 }
    for (const m of maquinas) c[m.estado] = (c[m.estado] ?? 0) + 1
    return c
  }, [maquinas])

  if (cargando) return <div className="tarjeta">Cargando tablero...</div>

  if (!maquinas.length) {
    return (
      <div className="tarjeta">
        <h2>Sin maquinas</h2>
        <p>No hay maquinas cargadas todavia. Ejecuta el seed
          (<code>node scripts/seed.mjs</code>) para crear la flota de prueba.</p>
      </div>
    )
  }

  return (
    <>
      <div className="leyenda">
        {ESTADOS_LEYENDA.map((e) => (
          <span key={e} className="leyenda-item">
            <span className="punto" style={{ background: COLOR_ESTADO[e] }} />
            {LABEL_ESTADO[e]} <strong>{conteo[e]}</strong>
          </span>
        ))}
        <span className="leyenda-total">{maquinas.length} maquinas</span>
      </div>

      <div className="grid-maquinas">
        {maquinas.map((m) => (
          <button
            key={m.id}
            className="celda-maquina"
            style={{ background: COLOR_ESTADO[m.estado] }}
            onClick={() => setSeleccion(m)}
            title={`MQ ${m.numero} · ${LABEL_ESTADO[m.estado]}`}
          >
            <span className="celda-num">{m.numero}</span>
            {m.criticidad >= 0.8 && <span className="celda-critica">!</span>}
          </button>
        ))}
      </div>

      {seleccion && (
        <MaquinaDetalle
          maquina={seleccion}
          onCerrar={() => setSeleccion(null)}
        />
      )}
    </>
  )
}
