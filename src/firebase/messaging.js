// Mensajeria (FCM): registra el token del dispositivo en el perfil del usuario
// y escucha mensajes en primer plano. El envio de los push lo hacen las Cloud
// Functions (carpeta functions/), que reaccionan a los cambios de incidencias.
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { app, db } from './config'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Registra el service worker pasandole la config por query (el SW no lee .env).
function registrarSW() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }
  const qs = new URLSearchParams(cfg).toString()
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${qs}`)
}

// Inicializa la mensajeria para un usuario ya autenticado.
// Pide permiso, obtiene el token y lo guarda en usuarios/{uid}.fcmTokens.
export async function initMensajeria(uid, onMensaje) {
  try {
    if (!(await isSupported())) return
    if (!VAPID_KEY) {
      console.warn('[FCM] Falta VITE_FIREBASE_VAPID_KEY; se omiten notificaciones.')
      return
    }
    if (!('Notification' in window)) return

    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') return

    const swReg = await registrarSW()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    })
    if (token && uid) {
      await updateDoc(doc(db, 'usuarios', uid), {
        fcmTokens: arrayUnion(token)
      }).catch((e) => console.warn('[FCM] No se pudo guardar el token:', e.message))
    }

    // Mensajes en primer plano (app abierta).
    onMessage(messaging, (payload) => {
      onMensaje?.(payload?.notification ?? {})
    })
  } catch (e) {
    console.warn('[FCM] Mensajeria no disponible:', e.message)
  }
}
