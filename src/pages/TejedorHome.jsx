// Home del Tejedor. En la Etapa 3 aqui ira la pantalla minima de reporte
// (elegir maquina + descripcion breve). Por ahora es un marcador.
import Layout from '../components/Layout'

export default function TejedorHome() {
  return (
    <Layout titulo="Reportar falla">
      <div className="tarjeta">
        <h2>Bienvenido</h2>
        <p>Desde aqui podras reportar una falla: elegir la maquina y describir
          en pocas palabras lo que ves.</p>
        <p className="nota-etapa">Pantalla de reporte: Etapa 3.</p>
      </div>
    </Layout>
  )
}
