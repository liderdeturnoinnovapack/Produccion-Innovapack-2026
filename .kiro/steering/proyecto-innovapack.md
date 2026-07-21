---
inclusion: always
---

# Producción Innovapack 2026 — Contexto del proyecto

Documento de contexto para retomar el proyecto (p. ej. desde Kiro de escritorio).
Resume arquitectura, decisiones, reglas de negocio y pendientes.

## Qué es
Sistema de producción para la planta **Innovapack** (empaques plásticos). Dos apps:
- **Reporte** (`/reporte/`): formulario para operarios. Registra producción del turno
  (máquina, referencia, mermas, tiempos muertos, rollos).
- **Panel** (`/panel/`): dashboards para jefes/administrativos. Protegido con PIN.
- **Landing** (`/index.html`): selector entre las dos apps.

Todo en **español**. Desplegado en **GitHub Pages**:
`https://liderdeturnoinnovapack.github.io/Produccion-Innovapack-2026/`

## Arquitectura (clave)
- **Sin build step (buildless):** React 18 + Babel-standalone por CDN, `<script type="text/babel">`.
  Los módulos compartidos van como `<script>` clásico.
- **Lógica compartida:** `shared/calculos.js` (única fuente de verdad de utilidades,
  clasificación y cálculos), `shared/config.js` (constantes), `shared/data.js`
  (catálogo DEFAULT_CATALOG + CLASIFICACION_SKU + PESOS_SKU).
- **Backend = Google Apps Script + Google Sheets.** No hay backend propio.
  - Un solo script (con `doGet`/`doPost`) desplegado; el proyecto usa un endpoint
    (`SHEETS_URL_*` en cada `index.html`).
  - Reportes: se guardan como filas en hojas **por máquina**.
  - **Config compartida:** hoja `Config` (clave/valor JSON) con `metas`, `pesos`,
    `catalogo`, `maquinas`, `clasificacion`. Se sincroniza vía `?tipo=config` (GET)
    y POST `{tipo:"config",...}`. Cache local en `localStorage` + migración inicial.

## Convenciones de trabajo (IMPORTANTES)
- **Validar antes de subir:** transformar el `<script type="text/babel">` con
  `@babel/standalone` (preset react) y `node --check shared/calculos.js`.
- **Push:** siempre a `main` con la herramienta de push (no `git push` manual).
  Commit local primero. Avisar al usuario de recargar con **Ctrl+F5** (GitHub Pages
  tarda 1–2 min).
- **fs_write/append grandes pueden abortar:** hacer cambios en trozos moderados.
- El usuario está en navegador: no puede ver el filesystem. Surface de cambios = repo.

## Seguridad
### Etapa 2 (PIN) — reemplazada por Fase A
- (Histórico) El PIN del panel se validaba en el servidor contra `ADMIN_PIN`.

### Fase A — usuarios + roles + auditoría (hecha en frontend, requiere Apps Script nuevo)
- Login del panel = **usuario + contraseña** (ya no PIN). Se valida en el servidor
  contra la hoja **`Usuarios`** (columnas `usuario | pass | nombre | rol | activo`).
- Roles: **admin** (Gabriel Unda `gabriel.unda`, Jose Cortes `jose.cortes`, clave
  `072026`) y **lectura** (`consulta1`, `consulta2`, clave `12345678`, solo visualiza:
  sin editor de catálogo/config ni check SIESA).
- Frontend: `LoginGate` (panel) llama `validarLogin(url,usuario,pass)` → GET
  `?tipo=login&usuario=&pass=` → `{ok,nombre,rol}`. `loadReports` manda `?usuario=&pass=`.
  `postConfig_` manda `{tipo:"config",clave,valor,usuario,pass}`. `PanelView` recibe `rol`
  y define `readonly = rol==='lectura'` (oculta Administración, deshabilita check SIESA).
- **Auditoría:** hoja **`Auditoria`** (`ts | fecha | usuario | evento | detalle`).
  El servidor registra login y escrituras de config.
- Reglas Apps Script: doGet `tipo=login`→valida; `tipo=config`→abierto (lo usa el
  formulario); resto (lectura de reportes)→exige usuario válido. doPost `tipo=config`→
  exige rol **admin**; `tipo=audit`→append; resto (guardar reporte)→abierto (operarios).
- Campo de contraseña en payloads se llama **`pass`** (no choca con `clave` de config).
- Semilla de usuarios: ejecutar `configurarUsuarios()` una vez en el editor de Apps Script.
- Repo público → las contraseñas NO van en el código; viven en la hoja `Usuarios`.

## Reglas de negocio
### Clasificación (en `clasificarReporte`, calculos.js)
La MÁQUINA manda sobre el SKU. Excepciones que van a **Producto Terminado** aunque
salgan de máquina de proceso:
- Extrusora 2 + Lámina Termoencogible.
- Refiladora + referencia que contenga "lámina".
La Impresora siempre produce "Lámina Impresa".

### Tipo en Producto en Proceso (`tipoProceso`)
- Impresora → Lámina Impresa.
- Refiladora: ref con "bolsa" → Lámina Doblada; con "lámina" → Lámina.
- Extrusoras → Lámina / Semitubular / Tubular / Lámina Termoencogible.
- Color por referencia: "transp/cristal" → Transparente; "blanc" → Blanco.

### Pesos por unidad (para convertir unidades→kg; merma % y kg de selladoras)
Regla automática por tipo (`pesoPorTipoDe`), override manual por SKU en el editor ⚖️ Pesos:
- Bolsa de agua: 0.026
- Valvulada 40kg: 0.08 / resto: 0.05
- Abierta estuco 25kg: 0.07 / (pegante/porcelanato/cerámico) 0.05
- Abierta Alimentos 2.5kg: 0.012 / 1kg: 0.008
- Flow Pack 2kg: 0.017 / 1kg: 0.012

### Rollos
Los números de rollo van 1→400 y se reinician **por referencia**. Cada rollo producido
es un registro (no se deduplica por número). `parseRollos` extrae rollos del texto.

### Fechas
`getFechaISO` normaliza a `yyyy-mm-dd` desde varios formatos (ISO, dd/MM/yyyy y el
`Date.toString()` "Sat Jul 04 2026..."). Ignora valores no-fecha (consecutivos).
En UI: eje X y fechas se muestran `DD/MM` (corto) y `DD/MM/AAAA` (tooltip/tablas).

### Eficiencia / rendimiento
Se agrupa por turno físico (fecha+turno) y se **topan** las horas productivas al
límite del turno (evita el sobreconteo por múltiples reportes en un mismo turno).
El panel recalcula rendimiento con metas EDITABLES (el formulario solo guarda datos crudos).

## Estética / marca
- Colores de marca (del logo): azul `#0091C7`, verde `#7CB342` (variables `--brand-blue`,
  `--brand-green`). Acento = azul de marca.
- Tipografía: **IBM Plex Sans** (encabezados, var `--head`) + **Inter** (cuerpo, `--sans`)
  + **IBM Plex Mono** (números, `--mono`).
- Modo **claro/oscuro** con toggle (persistido en localStorage; `data-theme` en <html>;
  variables de color + `color-scheme`). Logo con fondo transparente (PNG procesado).
- Encabezado: dos líneas apiladas (azul arriba, verde abajo: borde + box-shadow).
- Tarjetas de gráficas con línea superior de marca; tarjetas KPI con línea lateral de color.

## Panel — qué contiene
- **General:** filtros globales, KPIs (Reportes, Producción, Merma %, Tiempos muertos,
  % Eficiencia), comparativo 7d vs 7d, tendencia de eficiencia, top motivos de TM,
  producción por día (Kg/Und), merma por máquina, tortas por máquina, resumen por
  máquina (con semáforo de metas), historial (con exportar filtrado y favoritos).
- **Producto Terminado:** inventario por SKU (rank de rotación, antigüedad, marca ⚠️
  sin peso) + tortas por tipo/sector + Top 5 por tipo + historial.
- **Producto en Proceso:** inventario (filtros máquina/tipo/medida/color + buscar por
  #rollo/SISA/referencia; chips kg por tipo) + tortas + historial.
- Trazabilidad por referencia (modal): separa **Peso Terminado** vs **Peso En Proceso**.
- Editor de catálogo/SKU, máquinas, metas y pesos.

## Fases pendientes
- **Fase 2 — Trazabilidad de rollos:** cadenas rollo madre → impreso → refilado.
  (Esperando inventario base de rollos del usuario.)
- **Fase 3 — Consumos:** al consumir producto terminado se ingresa nº de pedido y
  remisión con las cantidades.
- **Idea en pausa:** autocompletar cuadros externos de Excel/SharePoint (Calidad
  "Producto no conforme" y "Seguimiento Producción") con datos del Sheet — vía Power
  Query (JSON del Apps Script) o formulario web. Requiere ver la estructura de esos cuadros.
