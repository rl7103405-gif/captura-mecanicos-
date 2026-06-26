// Pantalla de login. Tras iniciar sesion, AuthContext carga el rol y el
// enrutador redirige a la home correspondiente.
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HOME_POR_ROL } from '../constants/roles'

export default function Login() {
  const { authUser, rol, cargando, iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesion con rol, no mostramos el login.
  if (!cargando && authUser && rol) {
    return <Navigate to={HOME_POR_ROL[rol] ?? '/'} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await iniciarSesion(email.trim(), password)
    } catch (err) {
      setError(traducirError(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="centro-pantalla">
      <form className="tarjeta login-card" onSubmit={onSubmit}>
        <h1 className="login-titulo">Gestion de Mantenimiento</h1>
        <p className="login-sub">Inicia sesion para continuar</p>

        <label className="campo">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="campo">
          <span>Contrasena</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="alerta-error">{error}</div>}

        <button className="btn-primario btn-grande" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function traducirError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Correo invalido.'
    case 'auth/user-disabled':
      return 'Usuario deshabilitado.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contrasena incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento.'
    default:
      return 'No se pudo iniciar sesion. Revisa tu conexion.'
  }
}
