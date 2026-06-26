// Enrutador principal. Cada rol tiene su home protegida por rol.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ROLES, HOME_POR_ROL } from './constants/roles'
import Login from './pages/Login'
import TejedorHome from './pages/TejedorHome'
import SupervisorHome from './pages/SupervisorHome'
import MecanicoHome from './pages/MecanicoHome'

// Redirige la raiz "/" segun el rol (o al login si no hay sesion).
function RaizSegunRol() {
  const { authUser, rol, cargando } = useAuth()
  if (cargando) return <div className="centro-pantalla">Cargando...</div>
  if (!authUser || !rol) return <Navigate to="/login" replace />
  return <Navigate to={HOME_POR_ROL[rol] ?? '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/tejedor"
            element={
              <ProtectedRoute rolesPermitidos={[ROLES.TEJEDOR]}>
                <TejedorHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor"
            element={
              <ProtectedRoute rolesPermitidos={[ROLES.SUPERVISOR]}>
                <SupervisorHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mecanico"
            element={
              <ProtectedRoute rolesPermitidos={[ROLES.MECANICO]}>
                <MecanicoHome />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RaizSegunRol />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
