/* ============================================================================
   shared/calculos.js  —  Lógica compartida (única fuente de verdad)
   ----------------------------------------------------------------------------
   Utilidades, normalización/lectura de datos, clasificación y cálculos de
   utilización y rendimiento. Lo usan las dos apps.

   Decisiones de diseño:
   - El FORMULARIO solo guarda DATOS CRUDOS (no calcula rendimiento).
   - El PANEL recalcula utilización y rendimiento con las metas EDITABLES.
     => cambiar una meta recalcula todo el histórico automáticamente.
   - La clasificación (bodega/categoría/sector) se calcula en UN solo lugar:
     clasificarReporte(). Así no hay lógica duplicada entre apps.
   ========================================================================== */

/* ---------------------- utilidades básicas ------------------------ */
function uid(prefix){ return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2,8); }

function fmtDateTime(d){
  const p = n => String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------------------- lectura / normalización ------------------- */
/* Suma todos los números que aparezcan en un texto tipo "5 Kg + 3 Kg". */
function sumNumeros(str){
  if(str === undefined || str === null || str === "-" || str === "") return 0;
  const nums = String(str).match(/[\d.]+/g);
  return nums ? nums.reduce((a,n)=> a + (Number(n)||0), 0) : 0;
}

/* Limpia una hora a formato HH:MM. */
function cleanTime(v){
  if(!v) return "";
  const m = String(v).match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : String(v);
}

/* Devuelve la fecha del reporte en formato ISO (yyyy-mm-dd).
   Prioriza fechaTurno (fecha real de producción); si no, usa la fecha de
   digitación dd/MM/yyyy. Clave para el rendimiento por día. */
function getFechaISO(r){
  if(r.fechaTurno && r.fechaTurno !== "-"){
    return String(r.fechaTurno).slice(0,10);
  }
  if(r.fecha){
    const p = String(r.fecha).split(" ")[0]; // dd/MM/yyyy
    const parts = p.split("/");
    if(parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return "";
}

/* Normaliza un reporte que llega de Google Sheets. */
function normalizarReporte(r){
  return {
    ...r,
    horaInicio: cleanTime(r.horaInicio),
    horaFinal:  cleanTime(r.horaFinal),
    produccion: Number(r.produccion) || 0
  };
}

/* ---------------------- persistencia local ------------------------ */
function loadCatalog(){
  try{ const r = localStorage.getItem('catalogo-siesa'); return r ? JSON.parse(r) : window.DEFAULT_CATALOG; }
  catch(e){ return window.DEFAULT_CATALOG; }
}
function saveCatalog(list){ try{ localStorage.setItem('catalogo-siesa', JSON.stringify(list)); }catch(e){} }

/* Clasificación editable (para SKUs nuevos agregados desde el panel). */
function loadClasificacion(){
  try{
    const r = localStorage.getItem('clasificacion-siesa');
    const extra = r ? JSON.parse(r) : {};
    return {...window.CLASIFICACION_SKU, ...extra}; // los agregados sobrescriben/añaden
  }catch(e){ return {...window.CLASIFICACION_SKU}; }
}
function saveClasificacionExtra(obj){ try{ localStorage.setItem('clasificacion-siesa', JSON.stringify(obj)); }catch(e){} }

function loadMachines(){
  try{ const r = localStorage.getItem('catalogo-maquinas'); return r ? JSON.parse(r) : window.DEFAULT_MACHINES.slice(); }
  catch(e){ return window.DEFAULT_MACHINES.slice(); }
}
function saveMachines(list){ try{ localStorage.setItem('catalogo-maquinas', JSON.stringify(list)); }catch(e){} }

function loadMetas(){
  try{ const r = localStorage.getItem('metas-produccion'); return r ? JSON.parse(r) : window.DEFAULT_METAS; }
  catch(e){ return window.DEFAULT_METAS; }
}
function saveMetas(m){ try{ localStorage.setItem('metas-produccion', JSON.stringify(m)); }catch(e){} }

/* Consecutivo automático por máquina (lo usa el formulario). */
function getNextConsecutivo(maquina){
  const prefijo = window.MAQUINA_PREFIJOS[maquina];
  if(!prefijo) return "";
  const key = "consec-" + prefijo;
  const actual = parseInt(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, actual);
  return prefijo + "-" + String(actual).padStart(4,"0");
}

/* ---------------------- clasificación (única) --------------------- */
/* Determina bodega/categoría/sector de un reporte. La MÁQUINA manda sobre
   el SKU. Excepción: Extrusora 2 + Lámina Termoencogible = Producto Terminado.
   La Impresora siempre produce "Lámina Impresa". */
function clasificarReporte(r){
  const cls = loadClasificacion();
  const c = cls[r.siesa] || cls[r.sku] || {};
  const esProceso = window.MAQUINAS_PROCESO.includes(r.maquina);
  const esTermo = c.categoria === "Lámina Termoencogible";

  let categoria = c.categoria || "-";
  if(r.maquina === "Impresora") categoria = "Lámina Impresa";

  let bodega, sector;
  if(esProceso){
    if(r.maquina === "Extrusora 2" && esTermo){
      bodega = "Producto Terminado";
      sector = c.sector || "-";
    } else {
      bodega = "Producto en Proceso";
      sector = "-";
    }
  } else {
    bodega = c.bodega || "Producto Terminado";
    sector = c.sector || "-";
  }
  return { bodega, categoria, sector };
}

/* ---------------------- utilización ------------------------------- */
function calcUtilizacion(report){
  const th = window.TURNOS_HORAS[report.turno];
  if(!th || !report.horaInicio || !report.horaFinal) return null;

  const toMin = t => { const [h,m] = String(t).split(":").map(Number); return h*60 + (m||0); };
  const ini = toMin(report.horaInicio);
  const fin = toMin(report.horaFinal);
  let trabajado = fin - ini;
  if(trabajado < 0) trabajado += 1440; // cruce de medianoche

  const tmTotal = sumNumeros(report.tiemposMuertosMinutos || report.tiemposMuertos);
  const productivo = Math.max(0, trabajado - tmTotal);
  const pct = th.duracion > 0 ? Math.round((productivo / th.duracion) * 100) : 0;
  const pctTrabajado = trabajado > 0 ? Math.round((productivo / trabajado) * 100) : 0;

  return {
    duracionTurno: th.duracion,
    tiempoTrabajado: trabajado,
    tiemposMuertos: tmTotal,
    tiempoProductivo: productivo,
    utilizacion: Math.min(pct, 100),
    utilizacionTrabajado: Math.min(pctTrabajado, 100)
  };
}

/* ---------------------- rendimiento (metas editables) ------------- */
/* metasOverride: objeto de metas (el panel pasa las editables). */
function calcRendimiento(report, metasOverride){
  const util = calcUtilizacion(report);
  if(!util || util.tiempoProductivo <= 0) return null;
  const metas = metasOverride || loadMetas();
  const meta = metas[report.maquina];
  if(!meta) return null;
  const horas = util.tiempoProductivo / 60;
  const rendReal = Math.round((Number(report.produccion)||0) / horas);
  const pct = Math.round((rendReal / meta.meta) * 100);
  return { rendReal, meta: meta.meta, unidad: meta.unidad, pct };
}

/* ---------------------- Google Sheets ----------------------------- */
/* La URL se pasa por parámetro: cada app usa la suya. */
async function loadReports(url){
  try{
    const resp = await fetch(url);
    const data = await resp.json();
    if(!Array.isArray(data)) return [];
    return data.map(normalizarReporte).sort((a,b)=> (b.ts||0) - (a.ts||0));
  }catch(e){ return []; }
}

/* Guarda un reporte enviando SOLO datos crudos + una foto de clasificación
   (para que la hoja quede legible como respaldo). El panel recalcula
   utilización y rendimiento por su cuenta con las metas editables. */
async function saveReport(report, url){
  const mermasCantidad = (report.mermas||[]).filter(m=>m.cantidad!==undefined && m.cantidad!=="").map(m=>`${m.cantidad} ${m.unidad}`).join(" + ") || "-";
  const mermasMotivo   = (report.mermas||[]).filter(m=>m.cantidad!==undefined && m.cantidad!=="").map(m=>m.motivo||"-").join(" + ") || "-";
  const tmsMinutos     = (report.tiemposMuertos||[]).filter(t=>t.minutos!==undefined && t.minutos!=="").map(t=>`${t.minutos}min`).join(" + ") || "-";
  const tmsMotivo      = (report.tiemposMuertos||[]).filter(t=>t.minutos!==undefined && t.minutos!=="").map(t=>t.motivo||"-").join(" + ") || "-";

  const de = report.datosExtra || {};
  const rollos = de.rollos || [];
  const extraRollosStr = rollos.length > 0
    ? rollos.map(r => {
        const p = [];
        if(r.numero)      p.push(`#${r.numero}`);
        if(r.rolloMadre)  p.push(`Madre:${r.rolloMadre}`);
        if(r.medida)      p.push(`${r.medida}cm`);
        if(r.calibre)     p.push(`Cal:${r.calibre}`);
        if(r.peso)        p.push(`${r.peso}kg`);
        if(r.pesoInicial) p.push(`PesoIni:${r.pesoInicial}kg`);
        if(r.pesoFinal)   p.push(`PesoFin:${r.pesoFinal}kg`);
        return p.join(" | ");
      }).join(" // ")
    : "-";

  const cls = clasificarReporte(report);

  const payload = {
    fecha: report.fecha, fechaTurno: report.fechaTurno || "-",
    nombre: report.nombre, cargo: report.cargo, maquina: report.maquina,
    horaInicio: report.horaInicio || "", horaFinal: report.horaFinal || "", turno: report.turno,
    siesa: report.siesa, sku: report.sku, referencia: report.referencia,
    unidad: report.unidad, produccion: report.produccion,
    mermasCantidad, mermasMotivo,
    tiemposMuertosMinutos: tmsMinutos, tiemposMuertosMotivo: tmsMotivo,
    extraMedida: de.medida||"-", extraCalibre: de.calibre||"-", extraSentido: de.sentido||"-",
    extraRolloInicial: de.rolloInicial||"-", extraRolloFinal: de.rolloFinal||"-",
    extraRollosTotales: de.rollosTotales||"-", extraRollosProducidos: de.rollosProducidos||"-",
    extraPaqueteInicial: de.paqueteInicial||"-", extraPaqueteFinal: de.paqueteFinal||"-",
    extraUnidadesPorPaquete: de.unidadesPorPaquete||"-", extraSaldo: de.saldo||"-",
    extraRollos: extraRollosStr,
    consecutivo: report.consecutivo || "-",
    observaciones: report.observaciones || "-",
    bodega: cls.bodega, categoria: cls.categoria, sector: cls.sector
  };

  const resp = await fetch(url, { method:"POST", body: JSON.stringify(payload) });
  const result = await resp.json();
  if(result.status !== "ok") throw new Error("Sheets error: " + (result.message||""));
}


/* ============================================================================
   PESOS DE PRODUCTO  —  para calcular Merma % (merma kg ÷ producción kg)
   ----------------------------------------------------------------------------
   Los productos que se producen por UNIDADES (bolsas) necesitan un peso por
   unidad (kg) para poder convertir su producción a kg y cruzarla con la merma.
   Los pesos se editan desde el panel y se guardan en localStorage.
   ========================================================================== */
function loadPesos(){
  try{
    const r = localStorage.getItem('pesos-siesa');
    const extra = r ? JSON.parse(r) : {};
    return {...(window.PESOS_SKU || {}), ...extra};
  }catch(e){ return {...(window.PESOS_SKU || {})}; }
}
function savePesos(obj){ try{ localStorage.setItem('pesos-siesa', JSON.stringify(obj)); }catch(e){} }

/* Peso por unidad (kg) de un reporte, según su SKU. 0 si no está definido. */
function pesoUnidad(report, pesos){
  const p = pesos || loadPesos();
  return Number(p[report.siesa] || p[report.sku] || 0) || 0;
}

/* Producción del reporte convertida a KG.
   - Si la unidad ya es Kg → la producción tal cual.
   - Si es Unidades → producción × peso por unidad (0 si no hay peso definido). */
function produccionKg(report, pesos){
  const prod = Number(report.produccion) || 0;
  const unidad = String(report.unidad || "").toLowerCase();
  if(unidad.indexOf("kg") === 0) return prod;
  const pu = pesoUnidad(report, pesos);
  return pu > 0 ? prod * pu : 0;
}

/* Merma del reporte convertida a KG. Parsea el texto "5 Kg + 3 Unidades":
   los Kg suman directo; las Unidades se convierten con el peso por unidad. */
function mermaKg(report, pesos){
  const src = String(report.mermasCantidad || "");
  if(!src || src === "-") return 0;
  const pu = pesoUnidad(report, pesos);
  let total = 0, m;
  const re = /([\d.]+)\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)?/g;
  while((m = re.exec(src))){
    const n = Number(m[1]) || 0;
    const unit = (m[2] || "").toLowerCase();
    if(unit.indexOf("unid") === 0 || unit === "und" || unit === "u") total += pu > 0 ? n * pu : 0;
    else total += n; // Kg o sin unidad → se asume kg
  }
  return total;
}

/* Resumen de merma % para una lista de reportes.
   Solo cuenta reportes cuya producción se puede expresar en kg (kg directos, o
   unidades CON peso definido). Así el % no se distorsiona por faltantes. */
function resumenMerma(list, pesos){
  const p = pesos || loadPesos();
  let mermaTot = 0, prodTot = 0, sinPeso = 0;
  list.forEach(r=>{
    const pk = produccionKg(r, p);
    if(pk > 0){ prodTot += pk; mermaTot += mermaKg(r, p); }
    else if((Number(r.produccion)||0) > 0){ sinPeso++; }
  });
  const pct = prodTot > 0 ? Math.round((mermaTot / prodTot) * 1000) / 10 : null;
  return { mermaKg: Math.round(mermaTot), prodKg: Math.round(prodTot), pct, sinPeso };
}
