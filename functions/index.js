/**
 * Cloud Functions: envio de notificaciones push (FCM) segun el flujo de
 * incidencias.
 *
 *   - El mecanico recibe aviso cuando hay una nueva incidencia en la cola
 *     (al reportarse o priorizarse) y cuando se le asigna una.
 *   - El tejedor recibe aviso cuando su maquina ya fue atendida (aceptada)
 *     y cuando la incidencia se cerro.
 *
 * Requiere plan Blaze (las Functions necesitan facturacion habilitada, aunque
 * el uso real cabe holgado en la capa gratuita). Despliegue:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

// Envia una notificacion a un conjunto de tokens (ignora vacios).
async function enviar(tokens, title, body, data = {}) {
  const limpios = [...new Set((tokens || []).filter(Boolean))]
  if (!limpios.length) return
  await getMessaging().sendEachForMulticast({
    tokens: limpios,
    notification: { title, body },
    data
  })
}

async function tokensDeUsuario(uid) {
  if (!uid) return []
  const snap = await db.collection('usuarios').doc(uid).get()
  return snap.exists ? snap.data().fcmTokens || [] : []
}

async function tokensDeMecanicos() {
  const snap = await db.collection('usuarios').where('rol', '==', 'mecanico').get()
  const tokens = []
  snap.forEach((d) => tokens.push(...(d.data().fcmTokens || [])))
  return tokens
}

exports.notificarIncidencias = onDocumentWritten('incidencias/{id}', async (event) => {
  const antes = event.data?.before?.data()
  const despues = event.data?.after?.data()
  if (!despues) return // borrado

  const estadoAntes = antes?.estado
  const estadoDespues = despues.estado
  const mq = despues.maquina

  // Nueva incidencia en la cola -> avisar a los mecanicos.
  const entroACola =
    (!antes && (estadoDespues === 'reportada' || estadoDespues === 'priorizada')) ||
    (estadoAntes === 'reportada' && estadoDespues === 'priorizada')
  if (entroACola) {
    await enviar(
      await tokensDeMecanicos(),
      'Nueva incidencia en la cola',
      `MQ ${mq}: ${despues.descripcion || 'falla reportada'}`,
      { tag: `inc-${event.params.id}` }
    )
  }

  // Asignacion a un mecanico (acepto) -> avisar al tejedor que ya la atienden.
  if (estadoAntes !== 'atendiendo' && estadoDespues === 'atendiendo') {
    await enviar(
      await tokensDeUsuario(despues.tejedorId),
      'Tu maquina ya esta siendo atendida',
      `MQ ${mq}: ${despues.mecanicoNombre || 'un mecanico'} esta en ello.`,
      { tag: `inc-${event.params.id}` }
    )
  }

  // Cierre -> avisar al tejedor que se resolvio.
  if (estadoAntes !== 'cerrada' && estadoDespues === 'cerrada') {
    await enviar(
      await tokensDeUsuario(despues.tejedorId),
      'Incidencia cerrada',
      `MQ ${mq} esta operando de nuevo.`,
      { tag: `inc-${event.params.id}` }
    )
  }
})
