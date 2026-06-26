// Contexto de autenticacion. Maneja el usuario de Firebase Auth y carga su
// perfil (rol, nivel, turno) desde la coleccion `usuarios` de Firestore.
import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { initMensajeria } from '../firebase/messaging'

// Reenvia una notificacion recibida en primer plano al Toaster.
function avisar(n) {
  window.dispatchEvent(new CustomEvent('app-notif', { detail: n }))
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null) // usuario de Firebase Auth
  const [perfil, setPerfil] = useState(null) // documento usuarios/{uid}
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      setAuthUser(usuario)
      if (usuario) {
        try {
          const snap = await getDoc(doc(db, 'usuarios', usuario.uid))
          setPerfil(snap.exists() ? { id: snap.id, ...snap.data() } : null)
          // Registra el dispositivo para notificaciones push (no bloqueante).
          initMensajeria(usuario.uid, avisar)
        } catch (e) {
          console.error('[Auth] No se pudo cargar el perfil:', e)
          setPerfil(null)
        }
      } else {
        setPerfil(null)
      }
      setCargando(false)
    })
    return unsub
  }, [])

  const iniciarSesion = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const cerrarSesion = () => fbSignOut(auth)

  const value = {
    authUser,
    perfil,
    rol: perfil?.rol ?? null,
    nivel: perfil?.nivel ?? null,
    cargando,
    iniciarSesion,
    cerrarSesion
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
