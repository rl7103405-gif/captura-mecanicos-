// Ruta protegida: exige sesion iniciada y, opcionalmente, un rol permitido.
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HOME_POR_ROL } from '../constants/roles'

export default function ProtectedRoute({ rolesPermitidos, children }) {
  const { authUser, rol, cargando } = useAuth()

  if (cargando) {
    return <div className="centro-pantalla">Cargando...</div>
  }

  // Sin sesion -> al login.
  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  // Sesion pero sin perfil/rol valido en Firestore.
  if (!rol) {
    return (
      <div className="centro-pantalla">
        <div className="tarjeta">
          <h2>Cuenta sin rol asignado</h2>
          <p>Pide a un administrador que registre tu usuario en la coleccion
            <code> usuarios </code> con un rol valido.</p>
        </div>
      </div>
    )
  }

  // Rol no autorizado para esta ruta -> a su home.
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to={HOME_POR_ROL[rol] ?? '/login'} replace />
  }

  return children
}
