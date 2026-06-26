// Marco comun: barra superior con titulo, usuario y boton de salir.
import { useAuth } from '../context/AuthContext'
import { ROL_LABEL } from '../constants/roles'

export default function Layout({ titulo, children }) {
  const { perfil, rol, cerrarSesion } = useAuth()

  return (
    <div className="layout">
      <header className="barra-superior">
        <div className="barra-titulo">{titulo}</div>
        <div className="barra-usuario">
          <span className="usuario-nombre">
            {perfil?.nombre ?? 'Usuario'}
            <span className="usuario-rol">{ROL_LABEL[rol] ?? ''}</span>
          </span>
          <button className="btn-salir" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>
      <main className="contenido">{children}</main>
    </div>
  )
}
