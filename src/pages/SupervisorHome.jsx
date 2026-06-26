// Home del Supervisor (incluye Gerencia). En etapas siguientes ira el tablero
// de maquinas, los KPIs y el ranking de mecanicos.
import Layout from '../components/Layout'

export default function SupervisorHome() {
  return (
    <Layout titulo="Tablero">
      <div className="tarjeta">
        <h2>Bienvenido</h2>
        <p>Desde aqui veras el tablero de las 121 maquinas, asignaras urgencia
          a las incidencias y revisaras indicadores y el ranking de mecanicos.</p>
        <p className="nota-etapa">Tablero: Etapa 2 · Priorizacion: Etapa 3 ·
          KPIs: Etapa 4 · Ranking: Etapa 5.</p>
      </div>
    </Layout>
  )
}
