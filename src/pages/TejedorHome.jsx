// Home del Tejedor: pantalla minima de reporte de falla.
// Elegir maquina + describir en pocas palabras + turno. Nada mas.
import { useState } from 'react'
import Layout from '../components/Layout'
import SelectorMaquina from '../components/SelectorMaquina'
import { useAuth } from '../context/AuthContext'
import { reportarIncidencia } from '../services/incidencias'
import { TURNOS } from '../constants/roles'

export default function TejedorHome() {
  const { perfil } = useAuth()
  const [maquina, setMaquina] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [turno, setTurno] = useState(perfil?.turno ?? 1)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(null) // { folio }
  const [error, setError] = useState('')

  const puedeEnviar = maquina && descripcion.trim().length >= 3 && !enviando

  const onEnviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setError('')
    try {
      const r = await reportarIncidencia({
        usuario: perfil,
        numeroMaquina: maquina,
        descripcion,
        turno
      })
      setExito(r)
      setMaquina(null)
      setDescripcion('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo reportar. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (exito) {
    return (
      <Layout titulo="Reportar falla">
        <div className="tarjeta exito-card">
          <div className="exito-check">✓</div>
          <h2>Falla reportada</h2>
          <p>Folio <strong>{exito.folio}</strong>. Un mecanico la atendera pronto.</p>
          <button className="btn-primario btn-grande" onClick={() => setExito(null)}>
            Reportar otra falla
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titulo="Reportar falla">
      <form className="tarjeta" onSubmit={onEnviar}>
        <h2>1. Elige la maquina</h2>
        <SelectorMaquina valor={maquina} onChange={setMaquina} />

        <h2 style={{ marginTop: 22 }}>2. Que ves</h2>
        <textarea
          className="textarea-grande"
          placeholder="Describe en pocas palabras lo que pasa..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={200}
        />

        <h2 style={{ marginTop: 22 }}>3. Turno</h2>
        <div className="botones-turno">
          {TURNOS.map((t) => (
            <button
              type="button"
              key={t}
              className={`btn-turno ${turno === t ? 'activo' : ''}`}
              onClick={() => setTurno(t)}
            >
              Turno {t}
            </button>
          ))}
        </div>

        {error && <div className="alerta-error" style={{ marginTop: 16 }}>{error}</div>}

        <button
          className="btn-primario btn-grande"
          type="submit"
          disabled={!puedeEnviar}
          style={{ marginTop: 22 }}
        >
          {enviando ? 'Enviando...' : 'Reportar falla'}
        </button>
        {maquina && (
          <p className="texto-suave" style={{ textAlign: 'center', marginTop: 10 }}>
            Maquina seleccionada: <strong>MQ {maquina}</strong>
          </p>
        )}
      </form>
    </Layout>
  )
}
