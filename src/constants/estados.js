// Estados de una maquina (color en el tablero) y de una incidencia (flujo).

export const ESTADO_MAQUINA = {
  OPERANDO: 'verde', // operando
  REPORTADA: 'rojo', // reportada con falla
  ATENDIENDO: 'amarillo', // mecanico atendiendo
  NO_DISPONIBLE: 'azul' // no disponible
}

export const COLOR_ESTADO = {
  verde: '#16a34a',
  rojo: '#dc2626',
  amarillo: '#d97706',
  azul: '#2563eb'
}

export const LABEL_ESTADO = {
  verde: 'Operando',
  rojo: 'Reportada',
  amarillo: 'Atendiendo',
  azul: 'No disponible'
}

// Flujo de la incidencia (4 etapas con timestamps automaticos).
export const ESTADO_INCIDENCIA = {
  REPORTADA: 'reportada', // tejedor reporto, espera priorizacion
  PRIORIZADA: 'priorizada', // supervisor asigno urgencia, en cola
  ATENDIENDO: 'atendiendo', // mecanico acepto
  CERRADA: 'cerrada' // mecanico cerro
}

export const LABEL_INCIDENCIA = {
  reportada: 'Reportada',
  priorizada: 'En cola',
  atendiendo: 'En atencion',
  cerrada: 'Cerrada'
}

// Urgencia que elige el supervisor (3 niveles, no 8).
export const URGENCIA = {
  ALTA: 'alta',
  MEDIA: 'media',
  BAJA: 'baja'
}

export const LABEL_URGENCIA = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja'
}

// Peso base de cada urgencia para el calculo de prioridad.
export const PESO_URGENCIA = {
  alta: 100,
  media: 50,
  baja: 20
}

export const TOTAL_MAQUINAS = 121
