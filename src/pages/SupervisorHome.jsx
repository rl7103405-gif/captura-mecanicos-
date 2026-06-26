// Home del Supervisor (incluye Gerencia). Vista con pestanas:
//  - Tablero      (Etapa 2)
//  - Incidencias  (Etapa 3: priorizacion y seguimiento)
//  - Indicadores  (Etapa 4: KPIs)
//  - Ranking      (Etapa 5: indice justo de mecanicos)
import { useState } from 'react'
import Layout from '../components/Layout'
import TableroMaquinas from '../components/TableroMaquinas'
import PanelIncidencias from '../components/PanelIncidencias'
import PanelIndicadores from '../components/PanelIndicadores'
import PanelRanking from '../components/PanelRanking'

const TABS = [
  { id: 'tablero', label: 'Tablero' },
  { id: 'incidencias', label: 'Incidencias' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'ranking', label: 'Ranking' }
]

export default function SupervisorHome() {
  const [tab, setTab] = useState('tablero')

  return (
    <Layout titulo="Supervision">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'activo' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tablero' && <TableroMaquinas />}
      {tab === 'incidencias' && <PanelIncidencias />}
      {tab === 'indicadores' && <PanelIndicadores />}
      {tab === 'ranking' && <PanelRanking />}
    </Layout>
  )
}
