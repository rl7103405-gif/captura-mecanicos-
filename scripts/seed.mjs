/**
 * Script de inicializacion (seed) - se ejecuta UNA vez al montar el proyecto.
 *
 * Crea:
 *   - El catalogo de fallas (coleccion catalogo_fallas).
 *   - Usuarios de ejemplo con su rol (Auth + coleccion usuarios).
 *   - La flota de maquinas con su criticidad (coleccion maquinas).
 *
 * Dos formas de autenticarse:
 *   A) Google Cloud Shell / entorno Google (recomendado, sin archivo de clave):
 *      usa las credenciales de tu sesion (ADC). Solo:
 *        npm install firebase-admin
 *        node scripts/seed.mjs
 *      (toma el proyecto de GOOGLE_CLOUD_PROJECT o de .firebaserc)
 *   B) En tu PC con clave de servicio:
 *      Firebase Console -> Configuracion del proyecto -> Cuentas de servicio
 *      -> Generar nueva clave privada. Guardala como serviceAccountKey.json
 *      en la raiz (ya esta en .gitignore, NO la subas al repo). Luego:
 *        node scripts/seed.mjs
 *
 * Los mecanicos activos son 5 y distintos: Alejandro, Alex, Marcos, Martin, Oscar.
 * (Alex y Alejandro son personas diferentes; no se unifican.)
 */
import { readFileSync, existsSync } from 'node:fs'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// --- Catalogo (mismo contenido que src/constants/catalogoFallas.js) ---
const CATALOGO_FALLAS = JSON.parse(
  readFileSync(new URL('./catalogo_fallas.json', import.meta.url))
)

// --- Flota de maquinas (datos de prueba derivados del histor real) ---
// Numeros, criticidad por reincidencia y 8 marcadas como no disponibles.
const MAQUINAS = JSON.parse(
  readFileSync(new URL('./maquinas.json', import.meta.url))
)

// --- Usuarios de ejemplo. Cambia correos/contrasenas antes de usar. ---
const USUARIOS = [
  { nombre: 'Tejedor Demo', email: 'tejedor@demo.com', password: 'Demo1234', rol: 'tejedor', nivel: null, turno: 1 },
  { nombre: 'Supervisor Demo', email: 'supervisor@demo.com', password: 'Demo1234', rol: 'supervisor', nivel: 'supervisor', turno: 1 },
  { nombre: 'Gerencia Demo', email: 'gerencia@demo.com', password: 'Demo1234', rol: 'supervisor', nivel: 'gerencia', turno: null },
  // Mecanicos activos (5, distintos):
  { nombre: 'Alejandro', email: 'alejandro@demo.com', password: 'Demo1234', rol: 'mecanico', nivel: null, turno: 1 },
  { nombre: 'Alex', email: 'alex@demo.com', password: 'Demo1234', rol: 'mecanico', nivel: null, turno: 1 },
  { nombre: 'Marcos', email: 'marcos@demo.com', password: 'Demo1234', rol: 'mecanico', nivel: null, turno: 2 },
  { nombre: 'Martin', email: 'martin@demo.com', password: 'Demo1234', rol: 'mecanico', nivel: null, turno: 3 },
  { nombre: 'Oscar', email: 'oscar@demo.com', password: 'Demo1234', rol: 'mecanico', nivel: null, turno: 1 }
]

// Autenticacion: usa la clave de servicio si existe; si no, credenciales del
// entorno (ADC), p.ej. en Google Cloud Shell.
const keyUrl = new URL('../serviceAccountKey.json', import.meta.url)
if (existsSync(keyUrl)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(keyUrl))) })
} else {
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'quini-mecanicos'
  initializeApp({ credential: applicationDefault(), projectId })
  console.log(`Usando credenciales del entorno (ADC). Proyecto: ${projectId}`)
}
const auth = getAuth()
const db = getFirestore()

async function seedCatalogo() {
  const batch = db.batch()
  for (const f of CATALOGO_FALLAS) {
    batch.set(db.collection('catalogo_fallas').doc(f.codigo), f)
  }
  await batch.commit()
  console.log(`Catalogo: ${CATALOGO_FALLAS.length} fallas creadas.`)
}

async function seedUsuarios() {
  for (const u of USUARIOS) {
    let uid
    try {
      const existente = await auth.getUserByEmail(u.email)
      uid = existente.uid
      console.log(`Auth ya existia: ${u.email}`)
    } catch {
      const creado = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.nombre
      })
      uid = creado.uid
      console.log(`Auth creado: ${u.email}`)
    }
    await db.collection('usuarios').doc(uid).set({
      nombre: u.nombre,
      rol: u.rol,
      nivel: u.nivel,
      turno: u.turno
    })
  }
  console.log(`Usuarios: ${USUARIOS.length} perfiles escritos.`)
}

async function seedMaquinas() {
  // Firestore limita los batch a 500 operaciones; troceamos por seguridad.
  let i = 0
  while (i < MAQUINAS.length) {
    const lote = MAQUINAS.slice(i, i + 400)
    const batch = db.batch()
    for (const m of lote) {
      batch.set(db.collection('maquinas').doc(String(m.numero)), m)
    }
    await batch.commit()
    i += 400
  }
  console.log(`Maquinas: ${MAQUINAS.length} creadas.`)
}

async function main() {
  await seedCatalogo()
  await seedUsuarios()
  await seedMaquinas()
  console.log('\nSeed completado.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Error en seed:', e)
  process.exit(1)
})
