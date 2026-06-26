// Home del Mecanico. En la Etapa 3 ira la cola de trabajo priorizada,
// aceptar incidencia, reclasificar la falla y cerrarla documentando.
import Layout from '../components/Layout'

export default function MecanicoHome() {
  return (
    <Layout titulo="Mi cola de trabajo">
      <div className="tarjeta">
        <h2>Bienvenido</h2>
        <p>Aqui veras la cola de incidencias ordenada por prioridad, podras
          aceptarlas, clasificar el tipo de falla real y cerrarlas documentando
          la solucion.</p>
        <p className="nota-etapa">Cola y flujo de atencion: Etapa 3.</p>
      </div>
    </Layout>
  )
}
