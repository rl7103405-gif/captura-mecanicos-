# Gestion de Mantenimiento en Tiempo Real

Sistema para una planta de tejido de calcetines: reporte de fallas, priorizacion,
atencion y cierre de incidencias, con tablero de maquinas en tiempo real, KPIs y
ranking de mecanicos.

**Stack:** React + Vite (PWA) · Firebase (Firestore, Authentication, Hosting, FCM).

> Estado: **Etapas 1–7 construidas** — estructura + login con roles (1), tablero
> de maquinas en tiempo real (2), flujo completo de incidencias con timestamps
> automaticos (3), KPIs (4), ranking justo de mecanicos (5), notificaciones FCM
> (6) y pipeline de limpieza e importacion del historico (7). Falta la Etapa 8
> (despliegue), que ejecutas tu con tu proyecto Firebase (ver mas abajo).

## Roles

| Rol | Que hace |
|-----|----------|
| **Tejedor** | Reporta fallas (elige maquina + describe en pocas palabras). |
| **Supervisor** (incluye Gerencia) | Asigna urgencia, ve tablero, KPIs y ranking. Gerencia se distingue por `nivel: gerencia`. |
| **Mecanico** | Ve su cola, acepta, reclasifica el tipo de falla y cierra documentando. |

## Modelo de datos (Firestore)

- `usuarios` — `{ nombre, rol, nivel, turno }`
- `maquinas` — estado, disponibilidad, criticidad, acumulados *(Etapa 2)*
- `incidencias` — folio, maquina, tejedor, descripcion, urgencia, mecanico, tipo de falla, causa raiz, solucion, refacciones, timestamps `reportadaEn` / `aceptadaEn` / `cerradaEn` *(Etapa 3)*
- `catalogo_fallas` — 24 categorias con su tiempo estandar
- `paros` — Reporte de Paros MQ *(Etapa 7)*

---

## Como conectar tu Firebase

### 1. Crear el proyecto
1. Entra a <https://console.firebase.google.com> y crea un proyecto (plan **Spark/gratuito**).
2. Agrega una app **Web** (`</>`). Copia el objeto de configuracion del SDK.

### 2. Variables de entorno
```bash
cp .env.example .env
```
Rellena `.env` con los valores de tu app web (apiKey, authDomain, projectId, etc.).

### 3. Activar servicios en la consola
- **Authentication** → metodo **Correo/contrasena**.
- **Firestore Database** → crear base en **modo produccion** (las reglas las subimos abajo).

### 4. Instalar y correr en local
```bash
npm install
npm run dev
```
Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

### 5. Crear usuarios y catalogo (seed)
1. `npm install firebase-admin`
2. Consola → **Configuracion del proyecto → Cuentas de servicio → Generar nueva clave privada**. Guardala como `serviceAccountKey.json` en la raiz (ya esta en `.gitignore`).
3. Ejecuta:
   ```bash
   node scripts/seed.mjs
   ```
   Crea el catalogo de fallas y usuarios demo (tejedor, supervisor, gerencia y los 5 mecanicos: Alejandro, Alex, Marcos, Martin, Oscar). **Cambia los correos/contrasenas demo en `scripts/seed.mjs` antes de usarlo en serio.**

### 6. Subir las reglas de seguridad
```bash
npm install -g firebase-tools   # si no lo tienes
firebase login
# edita .firebaserc y pon tu PROJECT_ID en "default"
firebase deploy --only firestore:rules
```

### 7. Importar el historico real (Etapa 7)
El pipeline limpia el Excel y deja todo listo para Firestore:
```bash
# 1) Limpieza (Python). Estandariza fallas, corrige nombres, sanea horas.
pip install openpyxl
python3 scripts/import/limpiar.py /ruta/a/REPORTE_DE_MECANICOS.xlsx
#    -> scripts/import/out/  (incidencias, paros, tiempos refinados, reporte)

# 2) Importacion a Firestore (Node, requiere serviceAccountKey.json)
node scripts/import/importar.mjs            # incidencias + paros + acumulados
node scripts/import/importar.mjs --estandar # ademas aplica tiempos refinados
```
El reporte `scripts/import/out/reporte_limpieza.md` resume descartes,
clasificacion y la comparativa estandar vs promedio real.

### 8. Desplegar (Etapa 8)
```bash
npm run build
firebase deploy            # hosting + reglas + functions
# o por partes:
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions   # requiere plan Blaze
```

> **FCM / notificaciones:** en la consola de Firebase, en *Cloud Messaging*,
> genera el **certificado push web (VAPID)** y ponlo en `VITE_FIREBASE_VAPID_KEY`
> dentro de `.env`. Las Cloud Functions (carpeta `functions/`) envian los push y
> requieren el plan **Blaze** (el uso real cabe en la capa gratuita).

---

## Estructura del proyecto

```
.
├── index.html
├── vite.config.js          # Vite + PWA (manifest, service worker)
├── firebase.json           # Hosting + Firestore (rules/indexes)
├── firestore.rules         # Reglas de seguridad por rol
├── .env.example            # Plantilla de credenciales (copiar a .env)
├── scripts/
│   ├── seed.mjs            # Crea catalogo + usuarios con rol
│   └── catalogo_fallas.json
└── src/
    ├── main.jsx
    ├── App.jsx             # Enrutador + rutas protegidas por rol
    ├── index.css           # Estilos (acento azul, botones grandes)
    ├── firebase/config.js  # Inicializacion de Firebase (desde .env)
    ├── context/AuthContext.jsx
    ├── components/ (ProtectedRoute, Layout)
    ├── constants/ (roles, catalogoFallas)
    └── pages/ (Login, TejedorHome, SupervisorHome, MecanicoHome)
```
