// Hooks de tiempo real sobre Firestore con onSnapshot.
import { useEffect, useState } from 'react'
import { onSnapshot, query } from 'firebase/firestore'

// Suscribe a una coleccion/consulta y devuelve { datos, cargando, error }.
// Pasa las constraints (where/orderBy) en `constraints`.
export function useColeccion(ref, constraints = []) {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Serializamos las constraints para usarlas como dependencia estable.
  const claveDeps = JSON.stringify(
    constraints.map((c) => c?._key ?? c?.type ?? '')
  )

  useEffect(() => {
    if (!ref) return
    setCargando(true)
    const q = constraints.length ? query(ref, ...constraints) : query(ref)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDatos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      (err) => {
        console.error('[useColeccion]', err)
        setError(err)
        setCargando(false)
      }
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, claveDeps])

  return { datos, cargando, error }
}
