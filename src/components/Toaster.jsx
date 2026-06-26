// Muestra avisos en primer plano (notificaciones FCM con la app abierta).
import { useEffect, useState } from 'react'

export default function Toaster() {
  const [avisos, setAvisos] = useState([])

  useEffect(() => {
    let contador = 0
    const handler = (e) => {
      const n = e.detail || {}
      const id = ++contador
      setAvisos((prev) => [...prev, { id, title: n.title, body: n.body }])
      setTimeout(() => {
        setAvisos((prev) => prev.filter((a) => a.id !== id))
      }, 6000)
    }
    window.addEventListener('app-notif', handler)
    return () => window.removeEventListener('app-notif', handler)
  }, [])

  if (!avisos.length) return null

  return (
    <div className="toaster">
      {avisos.map((a) => (
        <div key={a.id} className="toast">
          {a.title && <div className="toast-titulo">{a.title}</div>}
          {a.body && <div className="toast-body">{a.body}</div>}
        </div>
      ))}
    </div>
  )
}
