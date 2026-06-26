/* Service worker de Firebase Cloud Messaging (mensajes en segundo plano).
   La configuracion llega por query string al registrar el SW (no hay acceso a
   variables .env aqui). Usa la version "compat" para service workers. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

const params = new URLSearchParams(self.location.search)
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
}

if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const n = payload.notification || {}
    self.registration.showNotification(n.title || 'Mantenimiento', {
      body: n.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload?.data?.tag || undefined
    })
  })
}
