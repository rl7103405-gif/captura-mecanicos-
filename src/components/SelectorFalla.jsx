// Selector del tipo de falla real contra el catalogo estandar (24 categorias).
// El mecanico determina que es tecnicamente (el tejedor solo describe lo que ve).
import { orderBy } from 'firebase/firestore'
import { catalogoRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import { CATALOGO_FALLAS } from '../constants/catalogoFallas'

export default function SelectorFalla({ valor, onChange }) {
  // Usamos el catalogo de Firestore; si aun no esta sembrado, caemos al local.
  const { datos } = useColeccion(catalogoRef, [orderBy('codigo')])
  const catalogo = datos.length ? datos : CATALOGO_FALLAS

  return (
    <select
      className="select-grande"
      value={valor?.codigo ?? ''}
      onChange={(e) => {
        const f = catalogo.find((c) => c.codigo === e.target.value)
        onChange(f ? { codigo: f.codigo, falla: f.falla, minEstandar: f.minEstandar } : null)
      }}
    >
      <option value="">— Selecciona el tipo de falla —</option>
      {catalogo.map((c) => (
        <option key={c.codigo} value={c.codigo}>
          {c.codigo} · {c.falla} ({c.minEstandar} min)
        </option>
      ))}
    </select>
  )
}
