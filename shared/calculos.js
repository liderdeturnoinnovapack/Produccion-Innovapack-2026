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

/* Devuelve la fecha del reporte en formato ISO (yyyy-mm-dd), agrupable por DÍA.
   Prioriza fechaTurno (fecha real de producción); si no, la fecha de digitación.
   Soporta varios formatos que puede devolver Google Sheets:
     - ISO:                 "2026-07-04..."
     - dd/MM/yyyy [hh:mm]:  "04/07/2026 18:14"
     - Date.toString():     "Sat Jul 04 2026 00:00:00 GMT-0500 (...)"
   Si el valor no es una fecha reconocible (p.ej. un consecutivo), lo ignora. */
function getFechaISO(r){
  var MESES = {Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
  function norm(v){
    if(v === undefined || v === null || v === "-" || v === "") return "";
    var s = String(v).trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);                 // ISO
    if(m) return m[1]+"-"+m[2]+"-"+m[3];
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);               // dd/MM/yyyy
    if(m) return m[3]+"-"+String(m[2]).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0");
    m = s.match(/\b([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{4})/);      // "Sat Jul 04 2026"
    if(m && MESES[m[1]]) return m[3]+"-"+MESES[m[1]]+"-"+String(m[2]).padStart(2,"0");
    var d = new Date(s);                                         // último recurso
    if(!isNaN(d.getTime())){
      var p = function(n){ return String(n).padStart(2,"0"); };
      return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
    }
    return "";
  }
  return norm(r.fechaTurno) || norm(r.fecha) || "";
}

/* Normaliza un reporte que llega de Google Sheets (soporta ambos formatos:
   keys camelCase del Apps Script viejo y keys "legibles" del nuevo). */
function normalizarReporte(r){
  /* Si el reporte ya viene con keys camelCase (formato viejo) se pasa directo;
     si trae keys legibles ("Fecha", "Nombre") lo mapeamos. */
  var out = r;
  if(r['Nombre'] !== undefined || r['Maquina'] !== undefined){
    // Derivar timestamp de Fecha ISO
    var tsVal = 0;
    try{ tsVal = new Date(r['Fecha']).getTime(); }catch(e){}
    // Formatear fecha a DD/MM/AAAA HH:MM en hora de Bogotá
    var fechaStr = '';
    try{
      var d=new Date(r['Fecha']);
      var parts=new Intl.DateTimeFormat('es-CO',{timeZone:'America/Bogota',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);
      var g={}; parts.forEach(function(p){g[p.type]=p.value;});
      fechaStr = g.day+'/'+g.month+'/'+g.year+' '+(g.hour==='24'?'00':g.hour)+':'+g.minute;
    }catch(e){ try{ fechaStr=new Date(r['Fecha']).toISOString(); }catch(e2){} }
    // Hora: los tiempos vienen como fecha 1899 en UTC con el offset LMT de
    // Bogotá (-04:56:16). Restándolo se recupera la hora local exacta (11:00).
    function parseHora(v){
      if(v==null||v==='-'||v==='') return '-';
      var x=new Date(v);
      if(isNaN(x.getTime())) return String(v);
      var totalMin = x.getUTCHours()*60 + x.getUTCMinutes() + x.getUTCSeconds()/60 - (4*60+56+16/60);
      totalMin = Math.round(totalMin);
      totalMin = ((totalMin % 1440) + 1440) % 1440;
      var hh=Math.floor(totalMin/60), mm=totalMin%60;
      return ('0'+hh).slice(-2)+':'+('0'+mm).slice(-2);
    }
    out = {
      ts: tsVal,
      fecha: fechaStr,
      nombre: r['Nombre']||'',
      cargo: r['Cargo']||'',
      maquina: r['Maquina']||'',
      horaInicio: parseHora(r['Hora inicio']),
      horaFinal: parseHora(r['Hora final']),
      turno: r['Turno']||'',
      siesa: String(r['Codigo Siesa']||r['SKU']||''),
      sku: String(r['SKU']||r['Codigo Siesa']||''),
      referencia: r['Referencia']||'',
      unidad: r['Unidad']||'',
      produccion: Number(r['Produccion'])||0,
      mermasCantidad: r['Merma Cantidad']||'-',
      mermasMotivo: r['Merma Motivo']||'-',
      tiemposMuertosMinutos: r['Tiempo muerto (min)']||'-',
      tiemposMuertosMotivo: r['Motivo tiempo muerto']||'-',
      extraMedida: r['Medida']!=null?String(r['Medida']):'-',
      extraCalibre: r['Calibre']!=null?String(r['Calibre']):'-',
      extraSentido: r['Sentido']||'-',
      extraRolloInicial: r['Rollo Inicial']!=null?String(r['Rollo Inicial']):'-',
      extraRolloFinal: r['Rollo Final']!=null?String(r['Rollo Final']):'-',
      extraRollosTotales: r['Rollos Totales']!=null?String(r['Rollos Totales']):'-',
      extraRollosProducidos: r['Rollos Producidos']!=null?String(r['Rollos Producidos']):'-',
      extraPaqueteInicial: r['Paquete Inicial']!=null?String(r['Paquete Inicial']):'-',
      extraPaqueteFinal: r['Paquete Final']!=null?String(r['Paquete Final']):'-',
      extraUnidadesPorPaquete: r['Unidades x Paquete']!=null?String(r['Unidades x Paquete']):'-',
      extraSaldo: r['Saldo']!=null?String(r['Saldo']):'-',
      extraRollos: r['Rollos Detalle']||'-',
      fechaTurno: r['Fecha Turno']||'',
      consecutivo: r['Consecutivo']||'',
      observaciones: r['Observaciones']||'-',
      bodega: r['Bodega']||'',
      categoria: r['Categoria']||'',
      sector: r['Sector']||'-'
    };
    // Generar ID estable
    out.id = (out.maquina||'X').replace(/\s+/g,'_') + '_' + (out.consecutivo||out.ts);
  }
  return {
    ...out,
    horaInicio: cleanTime(out.horaInicio),
    horaFinal:  cleanTime(out.horaFinal),
    produccion: Number(out.produccion) || 0
  };
}

/* ---------------------- persistencia local ------------------------ */
/* Catálogo = base (DEFAULT_CATALOG, en data.js, sin límite de tamaño) +
   EXTRAS (SKU agregados/editados desde el panel, guardados en Config).
   Se guardan solo los extras para no exceder el límite de ~50k caracteres por
   celda de Google Sheets. */
function loadCatalog(){
  const base = window.DEFAULT_CATALOG || [];
  let extra = [];
  try{ const r = localStorage.getItem('catalogo-extra'); extra = r ? JSON.parse(r) : []; }catch(e){ extra = []; }
  if(!Array.isArray(extra) || extra.length === 0) return base.slice();
  const map = {};
  base.forEach(x=>{ const k=x.siesa||x.sku; if(k) map[k]=x; });
  extra.forEach(x=>{ const k=x&&(x.siesa||x.sku); if(k) map[k]=x; });
  return Object.values(map);
}
function saveCatalog(list){
  const base = {}; (window.DEFAULT_CATALOG||[]).forEach(x=>{ const k=x.siesa||x.sku; if(k) base[k]=x; });
  const extra = (list||[]).filter(x=>{
    const k = x && (x.siesa||x.sku); if(!k) return false;
    const b = base[k];
    return !b || b.referencia !== x.referencia;   // solo lo nuevo o distinto del base
  });
  try{ localStorage.setItem('catalogo-extra', JSON.stringify(extra)); }catch(e){}
  postConfig_('catalogo_extra', extra);
}

/* Clasificación editable (para SKUs nuevos agregados desde el panel). */
function loadClasificacion(){
  try{
    const r = localStorage.getItem('clasificacion-siesa');
    const extra = r ? JSON.parse(r) : {};
    return {...window.CLASIFICACION_SKU, ...extra}; // los agregados sobrescriben/añaden
  }catch(e){ return {...window.CLASIFICACION_SKU}; }
}
function saveClasificacionExtra(obj){ try{ localStorage.setItem('clasificacion-siesa', JSON.stringify(obj)); }catch(e){} postConfig_('clasificacion', obj); }

function loadMachines(){
  try{ const r = localStorage.getItem('catalogo-maquinas'); return r ? JSON.parse(r) : window.DEFAULT_MACHINES.slice(); }
  catch(e){ return window.DEFAULT_MACHINES.slice(); }
}
function saveMachines(list){ try{ localStorage.setItem('catalogo-maquinas', JSON.stringify(list)); }catch(e){} postConfig_('maquinas', list); }

function loadMetas(){
  try{ const r = localStorage.getItem('metas-produccion'); return r ? JSON.parse(r) : window.DEFAULT_METAS; }
  catch(e){ return window.DEFAULT_METAS; }
}
function saveMetas(m){ try{ localStorage.setItem('metas-produccion', JSON.stringify(m)); }catch(e){} postConfig_('metas', m); }

/* ---------------------- config compartida (Google Sheets) ----------------------
   metas, pesos, catálogo, máquinas y clasificación se sincronizan con una hoja
   "Config" del Sheet vía Apps Script, además de quedar en localStorage (caché
   offline). Cada app define window.__CONFIG_URL con su endpoint. */
var _CFG_KEYS = { catalogo_extra:'catalogo-extra', maquinas:'catalogo-maquinas', metas:'metas-produccion', pesos:'pesos-siesa', clasificacion:'clasificacion-siesa', siesa_ok:'siesa-ok', reportes_siesa:'reportes-siesa-ok', pedidos_extra:'pedidos-extra' };

async function postConfig_(clave, valor){
  if(!window.__CONFIG_URL) return;
  try{
    await fetch(window.__CONFIG_URL, { method:"POST", body: JSON.stringify({ tipo:"config", clave: clave, valor: valor }) });
  }catch(e){}
}

/* Checklist compartido "cargado en SIESA" (lista de códigos siesa verificados). */
function loadVerificadoSiesa(){ try{ const r=localStorage.getItem('siesa-ok'); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function saveVerificadoSiesa(arr){ try{ localStorage.setItem('siesa-ok', JSON.stringify(arr)); }catch(e){} postConfig_('siesa_ok', arr); }

/* ===== FASE B: ingreso a SIESA por REPORTE (standby → bodega de inventario) =====
   Cada reporte de PRODUCTO TERMINADO queda en "standby" hasta que se confirma su
   ingreso a SIESA. Solo entonces su producción entra a la bodega de inventario
   (antesala de despachos). El check se guarda por id de reporte. */
function reporteId(r){ return r && (r.id || ((String(r.maquina||'X')).replace(/\s+/g,'_')+'_'+(r.consecutivo||r.ts||''))); }
function loadReportesSiesa(){ try{ const r=localStorage.getItem('reportes-siesa-ok'); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function saveReportesSiesa(arr){ try{ localStorage.setItem('reportes-siesa-ok', JSON.stringify(arr)); }catch(e){} postConfig_('reportes_siesa', arr); }
/* ¿El reporte necesita ingreso a SIESA? Solo los de Producto Terminado
   (los que alimentan la bodega de inventario / despachos). */
function requiereSiesa(r){ return clasificarReporte(r).bodega === "Producto Terminado"; }

/* ===== MAESTRO DE SKU: receta de lámina (tipo+medida) y cliente =====
   Datos en window.SKU_MAESTRO (shared/sku_maestro.js). El consumo se vincula
   por TIPO (color+material) + MEDIDA (sin calibre, porque varía). */
function skuMaestro(siesa){ return (window.SKU_MAESTRO||{})[String(siesa||'').trim()] || null; }
/* Receta de lámina que consume una referencia: {color, material, medida} o null. */
function recetaLamina(siesa){
  var m = skuMaestro(siesa);
  if(!m || !m.mat || !m.med) return null;
  return { color: m.col || '', material: m.mat, medida: Number(m.med)||0 };
}
/* Cliente de una referencia (para Pedidos/Despachos). */
function clienteDe(siesa){ var m = skuMaestro(siesa); return (m && m.cli) ? m.cli : ''; }
/* Clave de familia de lámina (para casar consumo con inventario de proceso). */
function claveLamina(color, material, medida){
  return [String(material||'').toLowerCase(), Math.round(Number(medida)||0), String(color||'').toLowerCase()].join('|');
}

/* ===== PEDIDOS Y DESPACHOS =====
   Base en shared/pedidos_base.js (PEDIDOS_BASE) + los que se agregan desde el
   panel (config "pedidos_extra"). Cada pedido: {fecha,pedido,cliente,item,
   resumen,estado,pedida,pendiente}. */
function loadPedidosExtra(){ try{ const r=localStorage.getItem('pedidos-extra'); return r?JSON.parse(r):[]; }catch(e){ return []; } }
function savePedidosExtra(arr){ try{ localStorage.setItem('pedidos-extra', JSON.stringify(arr)); }catch(e){} postConfig_('pedidos_extra', arr); }
function loadPedidos(){ return (window.PEDIDOS_BASE||[]).concat(loadPedidosExtra()); }
function agregarPedido(p){ const arr=loadPedidosExtra(); arr.push(p); savePedidosExtra(arr); return arr; }
/* ===== CONSUMO DE LÁMINA (extrusión produce, impresión consume) =====
   Consumo = Kg producidos + merma del proceso. Se casa por TIPO+MEDIDA. */
function _parseMedidaRef(ref){ var m=String(ref||'').match(/(\d+(?:[.,]\d+)?)\s*cm/i); return m?Math.round(parseFloat(m[1].replace(',','.'))):0; }
function _materialDeRef(ref, categoria){
  var s=String(ref||'').toUpperCase(), c=String(categoria||'');
  if(/termo/i.test(c)||s.indexOf('TERMO')>=0) return 'Termoencogible';
  if(/semi/i.test(c)||s.indexOf('SEM')===0||s.indexOf('SEMI')>=0) return 'Semitubular';
  if(/tubular/i.test(c)||s.indexOf('TUB')===0) return 'Tubular';
  if(/l[aá]mina/i.test(c)||s.indexOf('LAM')===0||s.indexOf('LAMINA')>=0) return 'Lamina';
  return '';
}
/* Familia de lámina de un reporte {color,material,medida} o null (maestro + fallback). */
function familiaLaminaDeReporte(r){
  var m=skuMaestro(r&&r.siesa);
  if(m && m.mat && m.med) return { color:m.col||'', material:m.mat, medida:Number(m.med) };
  var c=clasificarReporte(r);
  var mat=_materialDeRef(r.referencia, c.categoria);
  var med=Math.round(Number(r.extraMedida)||0) || _parseMedidaRef(r.referencia);
  if(!mat || !med) return null;
  var col=/trans/i.test(r.referencia||'')?'Transparente':'Blanco';
  return { color:col, material:mat, medida:med };
}
/* Balance de lámina por familia:
   Saldo = inventario inicial del corte (rollos) + producido (extrusoras POST-CORTE) − consumido (impresión POST-CORTE).
   Consumo = Kg producidos + merma. Solo se cuentan reportes POSTERIORES al corte del inventario. */
function balanceLamina(reports){
  var pool={};
  var corte=(window.INVENTARIO_BASE||{}).fechaCorte||'2026-07-17';
  function get(sp){ var k=claveLamina(sp.color,sp.material,sp.medida); if(!pool[k]) pool[k]={color:sp.color,material:sp.material,medida:sp.medida,inicial:0,producido:0,consumido:0,rProd:0,rCons:0}; return pool[k]; }
  // Inventario inicial del corte: rollos de extrusión en bodega
  var B=window.INVENTARIO_BASE||{};
  (B.ppRollos||[]).forEach(function(x){
    var sp=familiaLaminaDeReporte({siesa:x.siesa, referencia:x.desc, extraMedida:''});
    if(!sp) return; get(sp).inicial+=Number(x.kg)||0;
  });
  (reports||[]).forEach(function(r){
    // Solo reportes POSTERIORES al corte (el inventario ya incluye todo hasta el corte)
    var iso=getFechaISO(r); if(!iso || iso<=corte) return;
    var maq=String(r.maquina||'');
    if(/extrusora/i.test(maq)){
      var sp=familiaLaminaDeReporte(r); if(!sp) return;
      var g=get(sp); g.producido+=produccionKg(r); g.rProd++;
    } else if(/impresora/i.test(maq)){
      var sp2=recetaLamina(r.siesa); if(!sp2) sp2=familiaLaminaDeReporte(r); if(!sp2) return;
      var g2=get(sp2); g2.consumido+=produccionKg(r)+mermaKg(r); g2.rCons++;
    }
  });
  return Object.keys(pool).map(function(k){ var x=pool[k]; x.disponible=x.inicial+x.producido; x.saldo=x.disponible-x.consumido; return x; }).sort(function(a,b){return b.saldo-a.saldo;});
}

/* Inventario de PRODUCTO TERMINADO en bodega = inventario físico del corte (17/07,
   TODO lo real a esa fecha) + producción confirmada en SIESA POSTERIOR al corte.
   Agrupado por referencia. Fuente de la Bodega de Inventario y de la disponibilidad
   en Despachos. Así aparecen también las referencias que solo están en el corte. */
function inventarioBodegaPT(reports, okSet){
  var corte=(window.INVENTARIO_BASE||{}).fechaCorte||'2026-07-17';
  var P=loadPesos(), cls=loadClasificacion(), map={};
  function ens(siesa, ref){
    var k=String(siesa||'').trim(); if(!k) return null;
    if(!map[k]){ var c=cls[k]||{}; map[k]={siesa:k, referencia:ref||'', categoria:c.categoria||'-', sector:c.sector||'-', unidades:0, kg:0, reportes:0, ultima:'', desdeCorte:false}; }
    else if(ref && !map[k].referencia) map[k].referencia=ref;
    return map[k];
  }
  // Base: inventario físico del corte (todo lo real al corte, ya conciliado)
  ((window.INVENTARIO_BASE||{}).pt||[]).forEach(function(x){
    var g=ens(x.siesa, x.referencia); if(!g) return;
    var enKg=/l[aá]mina|rollo|termo/i.test(g.categoria||'');
    var pu=pesoUnidad({siesa:g.siesa,sku:g.siesa,referencia:x.referencia},P)||0;
    if(enKg){ g.kg+=Number(x.und)||0; } else { g.unidades+=Number(x.und)||0; g.kg+=(Number(x.und)||0)*pu; }
    g.desdeCorte=true; if(!g.ultima) g.ultima=corte;
  });
  // + producción confirmada POSTERIOR al corte (lo previo ya está en el corte)
  (reports||[]).forEach(function(r){
    if(!requiereSiesa(r)) return;
    if(okSet && !okSet.has(reporteId(r))) return;
    var iso=getFechaISO(r); if(!iso || iso<=corte) return;
    var g=ens(r.siesa||r.sku, r.referencia); if(!g) return;
    var unidad=String(r.unidad||'').toLowerCase(), prod=Number(r.produccion)||0;
    if(unidad.indexOf('kg')===0) g.kg+=prod; else { g.unidades+=prod; g.kg+=produccionKg(r); }
    g.reportes++; if(iso>g.ultima) g.ultima=iso;
  });
  return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.unidades-a.unidades;});
}
/* Mapa {siesa:{unidades,kg}} de disponibilidad (para Despachos). */
function inventarioDisponible(reports, okSet){
  var map={};
  inventarioBodegaPT(reports, okSet).forEach(function(x){ map[x.siesa]={unidades:x.unidades, kg:x.kg}; });
  return map;
}

/* Descarga la config remota y la refleja en localStorage (misma clave que usan
   los loaders). Devuelve el objeto remoto (o null si falla). */
async function loadConfigRemoto(url){
  if(!url) return null;
  try{
    const sep = url.indexOf("?")>=0 ? "&" : "?";
    const resp = await fetch(url + sep + "tipo=config");
    const cfg = await resp.json();
    if(cfg && typeof cfg==="object" && !Array.isArray(cfg)){
      for(const k in _CFG_KEYS){
        if(cfg[k]!==undefined && cfg[k]!==null){
          try{ localStorage.setItem(_CFG_KEYS[k], JSON.stringify(cfg[k])); }catch(e){}
        }
      }
      return cfg;
    }
  }catch(e){}
  return null;
}

/* Migración: si la config remota no tiene alguna clave pero el navegador sí,
   la sube (una sola vez). Así no se pierde lo ya configurado localmente. */
async function migrarConfigInicial(cfg){
  cfg = cfg || {};
  for(const k in _CFG_KEYS){
    if(cfg[k]!==undefined && cfg[k]!==null) continue;
    let local=null;
    try{ const r=localStorage.getItem(_CFG_KEYS[k]); local=r?JSON.parse(r):null; }catch(e){}
    if(local && (Array.isArray(local)?local.length:Object.keys(local).length)){
      await postConfig_(k, local);
    }
  }
}

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
   el SKU. La Impresora siempre produce "Lámina Impresa".
   Excepciones que van directo a PRODUCTO TERMINADO (aunque sean de máquina
   de proceso):
     · Extrusora 2 + Lámina Termoencogible
     · Refiladora + referencia de "lámina" (las que dicen "bolsa" siguen en
       proceso como Lámina Doblada). */
function clasificarReporte(r){
  const cls = loadClasificacion();
  const c = cls[r.siesa] || cls[r.sku] || {};
  const esProceso = window.MAQUINAS_PROCESO.includes(r.maquina);
  const esTermo = c.categoria === "Lámina Termoencogible";
  const ref = String(r.referencia || "").toLowerCase();
  const refLamina = ref.indexOf("lamina") !== -1 || ref.indexOf("lámina") !== -1;

  let categoria = c.categoria || "-";
  if(r.maquina === "Impresora") categoria = "Lámina Impresa";

  let bodega, sector;
  if(esProceso){
    const vaATerminado =
      (r.maquina === "Extrusora 2" && esTermo) ||   // termoencogible de Extrusora 2
      (r.maquina === "Refiladora" && refLamina);    // lámina refilada
    if(vaATerminado){
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
/* La URL se pasa por parámetro. El endpoint nuevo no exige PIN en la URL;
   la protección es el PinGate local del panel. */
async function loadReports(url, pin){
  try{
    const resp = await fetch(url);
    const data = await resp.json();
    if(!Array.isArray(data)) return [];
    return data.map(normalizarReporte).sort((a,b)=> (b.ts||0) - (a.ts||0));
  }catch(e){ return []; }
}

/* Validación de PIN local (ya no llama al servidor). */
async function validarPin(url, pin){
  return pin === "072026";
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
function savePesos(obj){ try{ localStorage.setItem('pesos-siesa', JSON.stringify(obj)); }catch(e){} postConfig_('pesos', obj); }

/* Peso por DEFECTO según el TIPO de bolsa (reglas Innovapack).
   Se usa cuando el SKU no tiene un peso manual definido.
   - Bolsa de agua ....................... 0.026 kg
   - Bolsa valvulada 40 kg ............... 0.08 kg
   - Bolsa valvulada (25 kg / resto) ..... 0.05 kg
   - Bolsa abierta con "estuco" 25 kg .... 0.07 kg
   - Bolsa abierta (pegante/porcel/cer) .. 0.05 kg
   - Cualquier otro tipo ................. 0 (sin peso) */
function pesoPorTipoDe(categoria, sector, referencia){
  const cat = categoria || "";
  const sec = sector || "";
  const ref = String(referencia || "").toLowerCase();
  if(cat === "Bolsa de agua") return 0.026;
  if(cat === "Bolsa valvulada") return /40\s*k/.test(ref) ? 0.08 : 0.05;
  if(cat === "Bolsa abierta"){
    if(sec === "Alimentos"){                       // bolsas de alimentos
      if(/2[.,]5/.test(ref)) return 0.014;          // 2.5 kg (ej. "X2.5")
      if(/1\s*k/.test(ref)) return 0.008;           // 1 kg
      return 0;                                      // otra medida: sin regla
    }
    return ref.indexOf("estuco") !== -1 ? 0.07 : 0.05; // estuco 0.07 / resto 0.05
  }
  if(cat === "Flow Pack"){
    if(/2[.,]5\s*k/.test(ref)) return 0.014;        // 2.5 kg
    if(/25\s*k/.test(ref)) return 0.05;             // 25 kg  (revisar antes que "5 kg")
    if(/5\s*k/.test(ref)) return 0.022;             // 5 kg
    if(/2\s*k/.test(ref)) return 0.017;             // 2 kg
    if(/1\s*k/.test(ref)) return 0.012;             // 1 kg
    return 0;                                        // otra medida: sin regla
  }
  return 0;
}
function pesoPorTipo(report){
  const cls = loadClasificacion();
  const c = cls[report.siesa] || cls[report.sku] || {};
  return pesoPorTipoDe(c.categoria, c.sector, report.referencia);
}

/* Peso por unidad (kg) de un reporte. Prioridad:
   1) peso MANUAL definido para el SKU (editor de Pesos) — manda siempre.
   2) peso por TIPO de bolsa (regla automática). */
function pesoUnidad(report, pesos){
  const p = pesos || loadPesos();
  const explicito = Number(p[report.siesa] || p[report.sku] || 0) || 0;
  if(explicito > 0) return explicito;
  return pesoPorTipo(report);
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


/* ============================================================================
   INVENTARIO (Fase 1)  —  lectura estructurada de rollos y stock derivado
   ----------------------------------------------------------------------------
   Los rollos se guardan en la hoja como texto legible (ej:
     "#123 | 45cm | Cal:3.0 | 45kg // #124 | 46cm | Cal:3.0 | 44kg").
   parseRollos() los convierte a objetos estructurados para poder inventariar.
   NOTA: los # de rollo se reinician (1..400), por eso cada rollo producido se
   cuenta como un REGISTRO independiente (no se deduplica por número).
   ========================================================================== */
function parseRollos(report){
  const src = String(report.extraRollos || "");
  if(!src || src === "-") return [];
  return src.split("//").map(chunk=>{
    const t = chunk.trim();
    if(!t) return null;
    const g = (re)=>{ const m = t.match(re); return m ? m[1] : ""; };
    const numero   = g(/#(\S+)/);
    const madre    = g(/Madre:(\S+)/i);
    const medida   = g(/(?:^|\|)\s*([\d.,]+)\s*cm/i);
    const calibre  = g(/Cal:([\d.,]+)/i);
    const pesoIni  = g(/PesoIni:([\d.,]+)\s*kg/i);
    const pesoFin  = g(/PesoFin:([\d.,]+)\s*kg/i);
    const peso     = g(/(?:^|\|)\s*([\d.,]+)\s*kg/i); // "45kg" simple (no PesoIni/Fin)
    return {
      numero, rolloMadre: madre, medida, calibre,
      peso: peso, pesoInicial: pesoIni, pesoFinal: pesoFin,
      maquina: report.maquina, fecha: report.fecha, fechaTurno: report.fechaTurno,
      turno: report.turno, operario: report.nombre,
      siesa: report.siesa, referencia: report.referencia
    };
  }).filter(Boolean);
}

/* Devuelve todos los rollos (registros) de una lista de reportes, aplanados. */
function rollosDeReportes(list){
  const out = [];
  list.forEach(r => parseRollos(r).forEach(roll => out.push(roll)));
  return out;
}

/* Inventario de Producto Terminado agrupado por referencia (SKU).
   Devuelve por referencia: cantidad (unidades), peso (kg) y datos de tipo. */
function inventarioPT(list){
  const p = loadPesos();
  const mapa = {};
  list.forEach(r=>{
    const key = r.siesa || r.sku || r.referencia;
    if(!mapa[key]){
      const c = clasificarReporte(r);
      mapa[key] = { siesa:key, referencia:r.referencia, categoria:c.categoria, sector:c.sector,
                    unidades:0, kg:0, reportes:0, unidad:r.unidad, ultima:"", pu:pesoUnidad(r,p) };
    }
    const prod = Number(r.produccion)||0;
    const unidad = String(r.unidad||"").toLowerCase();
    if(unidad.indexOf("kg")===0) mapa[key].kg += prod;
    else mapa[key].unidades += prod;
    mapa[key].kg += (unidad.indexOf("kg")===0 ? 0 : produccionKg(r,p));
    mapa[key].reportes += 1;
    const iso = getFechaISO(r);
    if(iso && iso > mapa[key].ultima) mapa[key].ultima = iso;
  });
  // sinPeso: producto por unidades sin peso definido (su producción no suma a kg)
  Object.values(mapa).forEach(x=>{ x.sinPeso = (x.unidades > 0 && (!x.pu || x.pu <= 0)); });
  return Object.values(mapa).sort((a,b)=> b.kg - a.kg);
}

/* Días transcurridos desde una fecha ISO (yyyy-mm-dd) hasta hoy. */
function diasDesde(iso){
  if(!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if(isNaN(d)) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return Math.round((hoy - d) / 86400000);
}

/* Agrega minutos de tiempo muerto por MOTIVO. Los reportes guardan minutos y
   motivos como texto paralelo unido por " + " (ej. "30min + 15min" y
   "Cambio de referencia + Falla mecánica"). Se emparejan por posición. */
function tmPorMotivo(list){
  const mapa = {};
  list.forEach(r=>{
    const partesMin = String(r.tiemposMuertosMinutos || "").split("+");
    const partesMot = String(r.tiemposMuertosMotivo || "").split("+");
    partesMin.forEach((pm, i)=>{
      const min = Number((pm.match(/[\d.]+/) || [0])[0]) || 0;
      if(min <= 0) return;
      let mot = (partesMot[i] || "").trim();
      if(!mot || mot === "-") mot = "Sin motivo";
      mapa[mot] = (mapa[mot] || 0) + min;
    });
  });
  return Object.entries(mapa).map(([motivo, min])=>({motivo, min})).sort((a,b)=> b.min - a.min);
}


/* ============================================================================
   PRODUCTO EN PROCESO  —  tipo/color de cada reporte y su inventario
   ----------------------------------------------------------------------------
   Reglas Innovapack:
   - Impresora .................... siempre "Lámina Impresa" (filtrable por SISA).
   - Refiladora (alimentos):
        · referencia con "bolsa" .. "Lámina Doblada"
        · referencia con "lámina" . "Lámina"
   - Extrusoras ................... según categoría / referencia:
        Lámina · Semitubular · Tubular · Lámina Termoencogible.
   El color se deduce de la referencia (Blanco / Transparente).
   ========================================================================== */
function tipoProceso(report){
  const cls = clasificarReporte(report);
  const cat = cls.categoria || "";
  const ref = String(report.referencia || "").toLowerCase();
  const tieneBolsa  = ref.indexOf("bolsa") !== -1;
  const tieneLamina = ref.indexOf("lamina") !== -1 || ref.indexOf("lámina") !== -1;

  if(report.maquina === "Impresora") return "Lámina Impresa";

  if(report.maquina === "Refiladora"){
    if(tieneBolsa)  return "Lámina Doblada";
    if(tieneLamina) return "Lámina";
    return cat || "Lámina";
  }

  // Extrusión (u otra máquina de proceso). OJO: "semitubular" contiene "tubular",
  // por eso se evalúa semitubular primero.
  if(cat === "Lámina Termoencogible") return "Lámina Termoencogible";
  if(cat === "Semitubular" || ref.indexOf("semitub") !== -1) return "Semitubular";
  if(cat === "Tubular"     || ref.indexOf("tubular") !== -1) return "Tubular";
  if(cat === "Lámina"      || tieneLamina) return "Lámina";
  return cat || "Lámina";
}

function colorProceso(report){
  const ref = String(report.referencia || "").toLowerCase();
  if(ref.indexOf("transp") !== -1 || ref.indexOf("cristal") !== -1) return "Transparente";
  if(ref.indexOf("blanc")  !== -1) return "Blanco";
  return "";
}

/* Inventario de Producto en Proceso: aplana rollos (o una fila-resumen por
   reporte sin detalle de rollos) y les añade tipo/color/código SISA.
   Recibe una lista YA filtrada a bodega = "Producto en Proceso". */
function inventarioProceso(list){
  const out = [];
  list.forEach(r=>{
    const tipo   = tipoProceso(r);
    const color  = colorProceso(r);
    const codigo = r.siesa || r.sku || "";
    const rolls  = parseRollos(r);
    if(rolls.length){
      rolls.forEach(roll=>{
        out.push({
          ...roll, tipo, color, codigo,
          peso: roll.peso || roll.pesoFinal || roll.pesoInicial || ""
        });
      });
    } else {
      const unidad = String(r.unidad || "").toLowerCase();
      const pesoKg = unidad.indexOf("kg") === 0 ? (Number(r.produccion) || 0) : "";
      out.push({
        numero:"", rolloMadre:"",
        medida:  (r.extraMedida  && r.extraMedida  !== "-") ? r.extraMedida  : "",
        calibre: (r.extraCalibre && r.extraCalibre !== "-") ? r.extraCalibre : "",
        peso: pesoKg, maquina: r.maquina, fecha: r.fecha, fechaTurno: r.fechaTurno,
        turno: r.turno, operario: r.nombre, siesa: r.siesa, referencia: r.referencia,
        tipo, color, codigo
      });
    }
  });
  return out;
}
