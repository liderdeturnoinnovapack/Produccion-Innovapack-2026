/* ============================================================================
   shared/config.js  —  Configuración común de las dos apps
   ----------------------------------------------------------------------------
   NO contiene URLs de Google Sheets a propósito: cada app (reporte/ y panel/)
   define su propia URL en su index.html, para mantener separados el endpoint
   de escritura (operarios) y el de lectura (administrativos).
   ========================================================================== */

window.TURNOS = [
  "Turno 1 (6am - 2pm)",
  "Turno 2 (1pm - 9pm)",
  "Turno 3 (9pm - 6am)",
  "Turno 4 (6am - 6pm)",
  "Turno 5 (6pm - 6am)",
  "Turno 6 (7am - 5pm)"
];

window.TURNOS_HORAS = {
  "Turno 1 (6am - 2pm)":  {inicio: "06:00", fin: "14:00", duracion: 480},
  "Turno 2 (1pm - 9pm)":  {inicio: "13:00", fin: "21:00", duracion: 480},
  "Turno 3 (9pm - 6am)":  {inicio: "21:00", fin: "06:00", duracion: 540},
  "Turno 4 (6am - 6pm)":  {inicio: "06:00", fin: "18:00", duracion: 720},
  "Turno 5 (6pm - 6am)":  {inicio: "18:00", fin: "06:00", duracion: 720},
  "Turno 6 (7am - 5pm)":  {inicio: "07:00", fin: "17:00", duracion: 600}
};

window.CARGOS = ["Op.Extrusión", "Op.Impresión", "Op.Sellado", "Ax.Integral"];

/* El PIN del panel YA NO vive en el código: se valida en el servidor (Apps Script),
   contra el valor guardado en Script Properties (ADMIN_PIN). */

/* Máquinas por defecto (editable desde el panel, se guarda en localStorage) */
window.DEFAULT_MACHINES = ["Extrusora 1","Extrusora 2","Impresora","Selladora 1","Selladora 2","Selladora Manual","Refiladora"];

/* Prefijos para el consecutivo automático por máquina */
window.MAQUINA_PREFIJOS = {
  "Extrusora 1": "EX1",
  "Extrusora 2": "EX2",
  "Impresora":   "IMP",
  "Selladora 1": "SE1",
  "Selladora 2": "SE2",
  "Selladora Manual": "SEM",
  "Refiladora":  "REF"
};

/* Clasificación de máquinas por tipo de unidad de producción */
window.MAQUINAS_KG  = ["Extrusora 1","Extrusora 2","Impresora","Refiladora"];
window.MAQUINAS_UND = ["Selladora 1","Selladora 2","Selladora Manual"];

/* Máquinas cuya producción es "en proceso" (salvo excepciones, ver calculos.js) */
window.MAQUINAS_PROCESO = ["Extrusora 1","Extrusora 2","Impresora","Refiladora"];

/* Metas por defecto. El operario NO las usa; son la base editable del panel.
   El panel es la ÚNICA fuente de verdad para el rendimiento. */
window.DEFAULT_METAS = {
  "Extrusora 1":      {meta: 100,  unidad: "kg/hr"},
  "Extrusora 2":      {meta: 100,  unidad: "kg/hr"},
  "Impresora":        {meta: 100,  unidad: "kg/hr"},
  "Selladora 1":      {meta: 1400, unidad: "und/hr"},
  "Selladora 2":      {meta: 1650, unidad: "und/hr"},
  "Selladora Manual": {meta: 1200, unidad: "und/hr"},
  "Refiladora":       {meta: 100,  unidad: "kg/hr"}
};

/* Motivos de tiempos muertos (formulario) */
window.MOTIVOS_TM = [
  {cod:"01",desc:"Tiempo de almuerzo"},{cod:"02",desc:"Tiempo de desayuno"},
  {cod:"03",desc:"Cuadre de máquina"},{cod:"04",desc:"Cambio de referencia"},
  {cod:"05",desc:"Cambio de Rollo"},{cod:"06",desc:"Cambio de mordaza"},
  {cod:"07",desc:"Pruebas de producto"},{cod:"08",desc:"Alistamiento de rodillos"},
  {cod:"09",desc:"Cambio de teflon"},{cod:"10",desc:"Falta Programacion"},
  {cod:"11",desc:"Aprobacion de calidad y cliente"},{cod:"12",desc:"Limpieza de accesorios"},
  {cod:"13",desc:"Falta de material"},{cod:"14",desc:"Limpieza de maquina"},
  {cod:"15",desc:"Daño de accesorios"},{cod:"16",desc:"Almacenamiento B.T"},
  {cod:"17",desc:"Mantenimiento P&C"},{cod:"18",desc:"Accidente laboral"},
  {cod:"19",desc:"Falla mecánica"},{cod:"20",desc:"Falla eléctrica"},
  {cod:"21",desc:"Falla Electrónica"},{cod:"22",desc:"Inventario"},
  {cod:"23",desc:"Maquina desenebarada"},{cod:"24",desc:"Cambio de máquinas"},
  {cod:"25",desc:"Limpieza y entrega de turno"},{cod:"26",desc:"Pruebas de calidad"},
  {cod:"27",desc:"Clasificacion de bolsas"},{cod:"28",desc:"Calentamiento de maquina"},
  {cod:"29",desc:"Material enredado"},{cod:"30",desc:"Limpieza, cierre de pedido"},
  {cod:"31",desc:"OTROS"}
];
