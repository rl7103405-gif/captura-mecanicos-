// Reloj compartido: devuelve "ahora" y se actualiza cada cierto intervalo.
// Sirve para recalcular la prioridad de la cola (que sube con la espera) y
// los contadores de tiempo detenido sin recargar.
import { useEffect, useState } from 'react'

export function useReloj(intervaloMs = 30000) {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return ahora
}
