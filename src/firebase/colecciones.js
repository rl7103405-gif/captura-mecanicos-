// Referencias centralizadas a las colecciones de Firestore.
import { collection, doc } from 'firebase/firestore'
import { db } from './config'

export const maquinasRef = collection(db, 'maquinas')
export const incidenciasRef = collection(db, 'incidencias')
export const catalogoRef = collection(db, 'catalogo_fallas')
export const usuariosRef = collection(db, 'usuarios')
export const parosRef = collection(db, 'paros')

export const maquinaDoc = (numero) => doc(db, 'maquinas', String(numero))
export const incidenciaDoc = (id) => doc(db, 'incidencias', id)
