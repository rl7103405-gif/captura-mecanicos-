/**
 * Importa a Firestore el historico ya limpio (salida de limpiar.py).
 *
 * Requisitos (igual que el seed):
 *   1) npm install firebase-admin   (en la raiz)
 *   2) serviceAccountKey.json en la raiz (ver README).
 *   3) Haber corrido antes:
 *        python3 scripts/import/limpiar.py <ruta_al_xlsx>
 *
 * Uso:
 *   node scripts/import/importar.mjs            # importa incidencias + paros
 *   node scripts/import/importar.mjs --estandar # ademas aplica tiempos refinados
 *
 * Escribe:
 *   - coleccion incidencias (historicas, estado=cerrada, fuente=historico)
 *   - coleccion paros
 *   - acumulados por maquina: fallasHistoricas, minutosDetenidaHistorico
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const AQUI = new URL('.', import.meta.url)
const OUT = new URL('./out/', AQUI)
const aplicarEstandar = process.argv.includes('--estandar')

const serviceAccount = JSON.parse(
  readFileSync(new URL('../../serviceAccountKey.json', AQUI))
)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const leer = (nombre) => JSON.parse(readFileSync(new URL(nombre, OUT)))
const ts = (iso) => (iso ? Timestamp.fromDate(new Date(iso)) : null)

// Escribe en lotes de 400 (limite de Firestore: 500 ops/batch).
async function enLotes(items, idFn, mapFn, coleccion) {
  let i = 0
  while (i < items.length) {
    const lote = items.slice(i, i + 400)
    const batch = db.batch()
    for (const it of lote) {
      batch.set(db.collection(coleccion).doc(String(idFn(it))), mapFn(it))
    }
    await batch.commit()
    i += 400
  }
}

async function importarIncidencias() {
  const inc = leer('incidencias_historico.json')
  await enLotes(
    inc,
    (it) => it.folio,
    (it) => ({
      ...it,
      reportadaEn: ts(it.reportadaEn),
      aceptadaEn: ts(it.aceptadaEn),
      cerradaEn: ts(it.cerradaEn)
    }),
    'incidencias'
  )
  console.log(`Incidencias historicas: ${inc.length} importadas.`)

  // Acumulados por maquina.
  const acc = {}
  for (const it of inc) {
    const a = (acc[it.maquina] ??= { fallas: 0, min: 0 })
    a.fallas += 1
    a.min += it.tiempoReparacionMin || 0
  }
  const entries = Object.entries(acc)
  let i = 0
  while (i < entries.length) {
    const lote = entries.slice(i, i + 400)
    const batch = db.batch()
    for (const [numero, a] of lote) {
      batch.set(
        db.collection('maquinas').doc(String(numero)),
        { fallasHistoricas: a.fallas, minutosDetenidaHistorico: a.min },
        { merge: true }
      )
    }
    await batch.commit()
    i += 400
  }
  console.log(`Acumulados actualizados en ${entries.length} maquinas.`)
}

async function importarParos() {
  const paros = leer('paros.json')
  await enLotes(
    paros,
    (it) => `PARO-${it.folio}`,
    (it) => ({
      ...it,
      paroEn: ts(it.paroEn),
      arranqueEn: ts(it.arranqueEn)
    }),
    'paros'
  )
  console.log(`Paros: ${paros.length} importados.`)
}

async function aplicarTiemposEstandar() {
  const refinados = leer('tiempos_estandar_refinados.json')
  const batch = db.batch()
  let n = 0
  for (const r of refinados) {
    if (r.minPromedioReal == null || r.n < 5) continue // solo con muestra suficiente
    batch.update(db.collection('catalogo_fallas').doc(r.codigo), {
      minEstandar: r.minPromedioReal,
      minEstandarOriginal: r.minEstandarActual
    })
    n += 1
  }
  await batch.commit()
  console.log(`Tiempos estandar refinados aplicados a ${n} fallas.`)
}

async function main() {
  await importarIncidencias()
  await importarParos()
  if (aplicarEstandar) await aplicarTiemposEstandar()
  console.log('\nImportacion completada.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Error en importacion:', e)
  process.exit(1)
})
