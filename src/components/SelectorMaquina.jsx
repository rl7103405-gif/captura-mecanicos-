// Selector de maquina en cuadricula (botones grandes para tablet).
// Muestra solo maquinas disponibles. La seleccionada se resalta.
import { orderBy } from 'firebase/firestore'
import { maquinasRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { COLOR_ESTADO } from '../constants/estados'

export default function SelectorMaquina({ valor, onChange }) {
  const { datos: maquinas, cargando } = useColeccion(maquinasRef, [orderBy('numero')])

  if (cargando) return <p>Cargando maquinas...</p>

  const disponibles = maquinas.filter((m) => m.disponible !== false)

  return (
    <div className="grid-maquinas selector">
      {disponibles.map((m) => {
        const activa = Number(valor) === Number(m.numero)
        return (
          <button
            type="button"
            key={m.id}
            className={`celda-maquina ${activa ? 'celda-activa' : ''}`}
            style={{ background: activa ? COLOR_ESTADO.azul : '#475569' }}
            onClick={() => onChange(m.numero)}
          >
            <span className="celda-num">{m.numero}</span>
          </button>
        )
      })}
    </div>
  )
}
