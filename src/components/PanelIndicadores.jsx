// Panel de indicadores (KPIs automaticos) para el supervisor.
// De mantenimiento: incidencias por dia/turno/mecanico, tiempos promedio,
// tiempo muerto total. De maquinas: ranking de problematicas, horas perdidas.
import { useMemo } from 'react'
import { orderBy } from 'firebase/firestore'
import { incidenciasRef, maquinasRef, parosRef } from '../firebase/colecciones'
import { useColeccion } from '../hooks/useColeccion'
import BarraKpi from './BarraKpi'
import {
  resumenMantenimiento,
  contarPor,
  aRankingDesc,
  claveDia,
  cumplimientoPorFalla,
  suma
} from '../utils/kpis'
import { formatoMinutos } from '../utils/tiempo'

export default function PanelIndicadores() {
  const { datos: incidencias, cargando } = useColeccion(incidenciasRef)
  const { datos: maquinas } = useColeccion(maquinasRef, [orderBy('numero')])
  const { datos: paros } = useColeccion(parosRef)

  const r = useMemo(() => resumenMantenimiento(incidencias), [incidencias])
  const parosMin = useMemo(() => suma(paros.map((p) => p.duracionMin)), [paros])

  const porTurno = useMemo(
    () => aRankingDesc(contarPor(incidencias, (i) => (i.turno ? `Turno ${i.turno}` : null))),
    [incidencias]
  )
  const porMecanico = useMemo(
    () => aRankingDesc(contarPor(r.cerradasLista, (i) => i.mecanicoNombre), 8),
    [r.cerradasLista]
  )
  const porDia = useMemo(() => {
    const mapa = contarPor(incidencias, (i) => claveDia(i.reportadaEn))
    return Object.entries(mapa)
      .map(([clave, valor]) => ({ clave, valor }))
      .sort((a, b) => a.clave.localeCompare(b.clave))
      .slice(-14)
  }, [incidencias])

  const maquinasProblema = useMemo(() => {
    return [...maquinas]
      .map((m) => ({ clave: `MQ ${m.numero}`, valor: m.fallasHistoricas ?? m.totalFallas ?? 0 }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
  }, [maquinas])

  const cumplimiento = useMemo(
    () => cumplimientoPorFalla(r.cerradasLista).slice(0, 8),
    [r.cerradasLista]
  )

  if (cargando) return <div className="tarjeta">Cargando indicadores...</div>

  return (
    <div>
      {/* Tarjetas resumen */}
      <div className="detalle-kpis" style={{ marginBottom: 22 }}>
        <Kpi num={r.total} lbl="Incidencias" />
        <Kpi num={r.abiertas} lbl="Abiertas" />
        <Kpi num={formatoMinutos(r.promRespuesta)} lbl="Prom. respuesta" />
        <Kpi num={formatoMinutos(r.promReparacion)} lbl="Prom. reparacion" />
      </div>
      <div className="detalle-kpis" style={{ marginBottom: 26 }}>
        <Kpi num={r.cerradas} lbl="Cerradas" />
        <Kpi num={formatoMinutos(r.tiempoMuertoTotal)} lbl="Tiempo muerto total" />
        <Kpi
          num={(r.tiempoMuertoTotal / 60).toFixed(1) + ' h'}
          lbl="Horas perdidas (incid.)"
        />
        <Kpi
          num={paros.length ? (parosMin / 60).toFixed(1) + ' h' : '—'}
          lbl={`Paros MQ (${paros.length})`}
        />
      </div>

      <div className="grid-paneles">
        <Seccion titulo="Incidencias por dia (ult. 14)">
          <BarraKpi datos={porDia} etiqueta={(c) => c.slice(5)} />
        </Seccion>
        <Seccion titulo="Incidencias por turno">
          <BarraKpi datos={porTurno} color="#0891b2" />
        </Seccion>
        <Seccion titulo="Cerradas por mecanico">
          <BarraKpi datos={porMecanico} color="#16a34a" />
        </Seccion>
        <Seccion titulo="Maquinas mas problematicas">
          <BarraKpi datos={maquinasProblema} color="#dc2626" sufijo=" fallas" />
        </Seccion>
      </div>

      <Seccion titulo="Cumplimiento vs tiempo estandar (por falla)">
        {cumplimiento.length === 0 && <p className="texto-suave">Aun sin cierres clasificados.</p>}
        {cumplimiento.length > 0 && (
          <table className="tabla">
            <thead>
              <tr><th>Falla</th><th>n</th><th>Prom. real</th><th>Estandar</th><th>Cumplimiento</th></tr>
            </thead>
            <tbody>
              {cumplimiento.map((c) => (
                <tr key={c.nombre}>
                  <td>{c.nombre}</td>
                  <td>{c.n}</td>
                  <td>{formatoMinutos(c.promReal)}</td>
                  <td>{c.estandar} min</td>
                  <td style={{ color: c.cumplimiento >= 100 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    {c.cumplimiento != null ? c.cumplimiento + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>
    </div>
  )
}

function Kpi({ num, lbl }) {
  return (
    <div className="kpi">
      <span className="kpi-num">{num ?? '—'}</span>
      <span className="kpi-lbl">{lbl}</span>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div className="tarjeta" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{titulo}</h3>
      {children}
    </div>
  )
}
