// Catalogo estandar de fallas: 24 categorias + tiempo estandar en minutos.
// El mecanico clasifica cada incidencia contra una de estas (Etapa 3).
// Los tiempos estandar se podran refinar con el histor real (Etapa 7).

export const CATALOGO_FALLAS = [
  { codigo: '01', falla: 'Rotura de agujas', minEstandar: 28 },
  { codigo: '02', falla: 'Falla en punzones', minEstandar: 32 },
  { codigo: '03', falla: 'Cuchilla sin filo / no corta', minEstandar: 25 },
  { codigo: '04', falla: 'Cambio de tejido (liso/felpa)', minEstandar: 35 },
  { codigo: '05', falla: 'Falla de valvula / electrovalvula', minEstandar: 22 },
  { codigo: '06', falla: 'Falla de elastico / licra', minEstandar: 25 },
  { codigo: '07', falla: 'Vanizado incorrecto', minEstandar: 25 },
  { codigo: '08', falla: 'Falla en bordado', minEstandar: 40 },
  { codigo: '09', falla: 'Error electronico (30/11)', minEstandar: 20 },
  { codigo: '10', falla: 'Pica / calidad de tejido', minEstandar: 18 },
  { codigo: '11', falla: 'Falla en alimentador', minEstandar: 30 },
  { codigo: '12', falla: 'Cambio de cilindro', minEstandar: 180 },
  { codigo: '13', falla: 'Hebras largas', minEstandar: 20 },
  { codigo: '14', falla: 'Falla en selectores / slyder', minEstandar: 40 },
  { codigo: '15', falla: 'Rotura de banda', minEstandar: 35 },
  { codigo: '16', falla: 'Ajuste de talla / cadena', minEstandar: 40 },
  { codigo: '17', falla: 'Rotura de platinas', minEstandar: 30 },
  { codigo: '18', falla: 'Falla electrica / fuente', minEstandar: 35 },
  { codigo: '19', falla: 'Fuga de aire', minEstandar: 25 },
  { codigo: '20', falla: 'No da talla', minEstandar: 20 },
  { codigo: '21', falla: 'Falla en transferencia', minEstandar: 30 },
  { codigo: '22', falla: 'Contaminacion', minEstandar: 20 },
  { codigo: '23', falla: 'Falla en actuador', minEstandar: 25 },
  { codigo: '24', falla: 'Otro (describir)', minEstandar: 30 }
]
