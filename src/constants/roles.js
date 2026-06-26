// Roles del sistema (son 3). Supervisor y Gerencia comparten vista, pero
// guardamos el "nivel" por separado para poder restringir permisos despues
// sin rehacer la app.

export const ROLES = {
  TEJEDOR: 'tejedor',
  SUPERVISOR: 'supervisor',
  MECANICO: 'mecanico'
}

// Niveles dentro del rol supervisor (permisos granulares a futuro).
export const NIVELES = {
  SUPERVISOR: 'supervisor',
  GERENCIA: 'gerencia'
}

export const ROL_LABEL = {
  [ROLES.TEJEDOR]: 'Tejedor',
  [ROLES.SUPERVISOR]: 'Supervisor / Gerencia',
  [ROLES.MECANICO]: 'Mecanico'
}

// Ruta de inicio por rol tras el login.
export const HOME_POR_ROL = {
  [ROLES.TEJEDOR]: '/tejedor',
  [ROLES.SUPERVISOR]: '/supervisor',
  [ROLES.MECANICO]: '/mecanico'
}

// Turnos que cubren 24 horas (3 turnos, 2 mecanicos por turno).
export const TURNOS = [1, 2, 3]
