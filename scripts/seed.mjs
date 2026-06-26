/**
 * Script de inicializacion (seed) - se ejecuta UNA vez al montar el proyecto.
 *
 * Crea:
 *   - El catalogo de fallas (coleccion catalogo_fallas).
 *   - Usuarios de ejemplo con su rol (Auth + coleccion usuarios).
 *
 * Requisitos:
 *   1) npm install firebase-admin
 *   2) Descarga la clave privada de servicio desde:
 *      Firebase Console -> Configuracion del proyecto -> Cuentas de servicio
 *      -> Generar nueva clave privada. Guardala como serviceAccountKey.json
 *      en la raiz (ya esta en .gitignore, NO la subas al repo).
 *   3) node scripts/seed.mjs
 *
 * Los mecanicos activos son 5 y distintos: Alejandro, Alex, Marcos, Martin, Oscar.
 * (Alex y Alejandro son personas diferentes; no se unifican.)
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// --- Catalogo (mismo contenido que src/constants/catalogoFallas.js) ---
const CATALOGO_FALLAS = JSON.parse(
  readFileSync(new URL('./catalogo_fallas.json', import.meta.url))
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

const serviceAccount = JSON.parse(
  readFileSync(new URL('../serviceAccountKey.json', import.meta.url))
)

initializeApp({ credential: cert(serviceAccount) })
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

async function main() {
  await seedCatalogo()
  await seedUsuarios()
  console.log('\nSeed completado.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Error en seed:', e)
  process.exit(1)
})
