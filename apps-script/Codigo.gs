/* ============================================================================
   Produccion Innovapack 2026 — Google Apps Script (backend)
   ----------------------------------------------------------------------------
   Copia versionada del script desplegado como Web App (doGet/doPost).
   NO se ejecuta desde el repo; vive en el editor de Apps Script (Google).
   Este archivo es el respaldo/fuente de verdad para control de versiones.

   Endpoints:
   - doGet  ?tipo=config        -> devuelve la hoja Config (clave/valor JSON)
   - doGet  (por defecto)       -> devuelve todos los reportes (todas las hojas
                                   de maquina, excepto las especiales)
   - doPost {tipo:"config",...} -> guarda/actualiza una clave de config
   - doPost {tipo:"audit",...}  -> registra una fila de auditoria
   - doPost (por defecto)       -> guarda un reporte en la hoja de su maquina

   Funciones de mantenimiento (ejecutar a mano desde el editor):
   - REPARAR_AHORA()  -> realinea filas que se guardaron corridas (bug de
                         columnas: un timestamp de 13 digitos caia en "Fecha").
   - REPARAR_SIESA()  -> recupera codigos (Codigo Siesa/SKU/Consecutivo) que
                         quedaron con formato de fecha y fija la columna como
                         texto plano.

   Notas de diseno:
   - guardarReporte_ escribe cada campo buscando SU columna por nombre de
     encabezado (inmune al orden de columnas y a columnas de mas/menos).
   - Las columnas de codigos se guardan como TEXTO para que Sheets no convierta
     los codigos numericos (~5.000.000) en fechas del ano 15699.
   ========================================================================== */

var SS = SpreadsheetApp.getActiveSpreadsheet();
var HOJAS_ESPECIALES = ['Config', 'Usuarios', 'Auditoria'];

// Orden camelCase que manda el frontend (se usa SOLO para reparar filas viejas dañadas).
var REPORTE_COLS = [
  'ts','fecha','fechaTurno','nombre','cargo','maquina','horaInicio','horaFinal','turno',
  'siesa','sku','referencia','unidad','produccion','mermasCantidad','mermasMotivo',
  'tiemposMuertosMinutos','tiemposMuertosMotivo','extraMedida','extraCalibre','extraSentido',
  'extraRolloInicial','extraRolloFinal','extraRollosTotales','extraRollosProducidos',
  'extraPaqueteInicial','extraPaqueteFinal','extraUnidadesPorPaquete','extraSaldo',
  'extraRollos','consecutivo','observaciones','bodega','categoria','sector'
];

// Encabezado en ESPAÑOL (el que ya usan tus hojas y el que lee el panel).
// Solo se usa para crear hojas NUEVAS, para que nazcan consistentes.
var HEADER_ES = [
  'Fecha','Nombre','Cargo','Maquina','Hora inicio','Hora final','Turno',
  'Codigo Siesa','SKU','Referencia','Unidad','Produccion','Merma Cantidad','Merma Motivo',
  'Tiempo muerto (min)','Motivo tiempo muerto','Medida','Calibre','Sentido',
  'Rollo Inicial','Rollo Final','Rollos Totales','Rollos Producidos',
  'Paquete Inicial','Paquete Final','Unidades x Paquete','Saldo','Rollos Detalle',
  'Fecha Turno','Consecutivo','Observaciones','Bodega','Categoria','Sector'
];

// Mapa: encabezado de la hoja -> clave que manda el frontend (con/sin tilde).
var HEADER_MAP = {
  'Fecha':'fecha', 'Nombre':'nombre', 'Cargo':'cargo',
  'Maquina':'maquina', 'Máquina':'maquina',
  'Hora inicio':'horaInicio', 'Hora final':'horaFinal', 'Turno':'turno',
  'Codigo Siesa':'siesa', 'Código Siesa':'siesa',
  'SKU':'sku', 'Referencia':'referencia', 'Unidad':'unidad',
  'Produccion':'produccion', 'Producción':'produccion',
  'Merma Cantidad':'mermasCantidad', 'Merma Motivo':'mermasMotivo',
  'Tiempo muerto (min)':'tiemposMuertosMinutos', 'Motivo tiempo muerto':'tiemposMuertosMotivo',
  'Medida':'extraMedida', 'Calibre':'extraCalibre', 'Sentido':'extraSentido',
  'Rollo Inicial':'extraRolloInicial', 'Rollo Final':'extraRolloFinal',
  'Rollos Totales':'extraRollosTotales', 'Rollos Producidos':'extraRollosProducidos',
  'Paquete Inicial':'extraPaqueteInicial', 'Paquete Final':'extraPaqueteFinal',
  'Unidades x Paquete':'extraUnidadesPorPaquete', 'Saldo':'extraSaldo',
  'Rollos Detalle':'extraRollos',
  'Fecha Turno':'fechaTurno', 'Consecutivo':'consecutivo', 'Observaciones':'observaciones',
  'Bodega':'bodega', 'Categoria':'categoria', 'Categoría':'categoria', 'Sector':'sector'
};

// Columnas que deben guardarse SIEMPRE como texto (evita que Sheets convierta
// los códigos numéricos ~5.000.000 en fechas del año 15699).
var COLS_TEXTO = ['Codigo Siesa','Código Siesa','SKU','Consecutivo'];

/* ================= FUNCIONES DE MANTENIMIENTO (ejecutar a mano) ================= */

// Recupera filas guardadas corridas (Fecha con timestamp de 13 dígitos).
function REPARAR_AHORA() {
  var n = repararReportesCorruptos_();
  Logger.log('Filas reparadas: ' + n);
  return n;
}

// Recupera códigos que quedaron como FECHA y fija las columnas de códigos como texto.
function REPARAR_SIESA() {
  var n = repararSiesaFechas_();
  Logger.log('Columnas de códigos reparadas: ' + n);
  return n;
}

/* ---------------------------- GET ---------------------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.tipo === 'config') return json_(leerConfig_());
  return json_(leerReportes_());
}

/* ---------------------------- POST ---------------------------- */
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }

  if (body.tipo === 'config') {
    guardarConfig_(body.clave, body.valor);
    return json_({ status: 'ok' });
  }
  if (body.tipo === 'audit') {
    registrarAuditoria_(body.usuario || '(anónimo)', body.evento || 'evento', body.detalle || '');
    return json_({ status: 'ok' });
  }
  guardarReporte_(body);
  return json_({ status: 'ok' });
}

/* ------------------------- AUDITORÍA ------------------------- */
function registrarAuditoria_(usuario, evento, detalle) {
  var sh = SS.getSheetByName('Auditoria');
  if (!sh) {
    sh = SS.insertSheet('Auditoria');
    sh.appendRow(['ts', 'fecha', 'usuario', 'evento', 'detalle']);
  }
  var ahora = new Date();
  sh.appendRow([ahora.getTime(), Utilities.formatDate(ahora, 'America/Bogota', 'yyyy-MM-dd HH:mm:ss'),
                usuario, evento, detalle]);
}

/* -------------------------- CONFIG --------------------------- */
function leerConfig_() {
  var sh = SS.getSheetByName('Config');
  if (!sh) return {};
  var datos = sh.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < datos.length; i++) {
    var clave = String(datos[i][0]).trim();
    if (!clave) continue;
    try { out[clave] = JSON.parse(datos[i][1]); }
    catch (err) { out[clave] = datos[i][1]; }
  }
  return out;
}

function guardarConfig_(clave, valor) {
  var sh = SS.getSheetByName('Config');
  if (!sh) { sh = SS.insertSheet('Config'); sh.appendRow(['clave', 'valor']); }
  var datos = sh.getDataRange().getValues();
  var texto = JSON.stringify(valor);
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === clave) {
      sh.getRange(i + 1, 2).setValue(texto);
      return;
    }
  }
  sh.appendRow([clave, texto]);
}

/* -------------------------- REPORTES ------------------------- */
// Escribe la fila alineando cada campo con SU columna por nombre de encabezado
// y fuerza texto en las columnas de códigos. Inmune al orden de columnas.
function guardarReporte_(payload) {
  var maquina = String(payload.maquina || 'Sin máquina').trim() || 'Sin máquina';
  payload.ts = new Date().getTime();

  var sh = SS.getSheetByName(maquina);
  if (!sh) { sh = SS.insertSheet(maquina); sh.appendRow(HEADER_ES); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADER_ES);

  var lastCol = sh.getLastColumn();
  var cab = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });

  var fila = cab.map(function (h) {
    var key = HEADER_MAP[h] || h;
    var v = payload[key];
    return (v !== undefined && v !== null) ? v : '';
  });
  sh.appendRow(fila);

  // Forzar TEXTO en las columnas de códigos de la fila recién agregada.
  var r = sh.getLastRow();
  for (var i = 0; i < cab.length; i++) {
    if (COLS_TEXTO.indexOf(cab[i]) !== -1) {
      var key2 = HEADER_MAP[cab[i]] || cab[i];
      var val = payload[key2];
      var cell = sh.getRange(r, i + 1);
      cell.setNumberFormat('@');
      cell.setValue(String(val !== undefined && val !== null ? val : ''));
    }
  }
}

function leerReportes_() {
  var out = [];
  var hojas = SS.getSheets();
  for (var s = 0; s < hojas.length; s++) {
    var sh = hojas[s];
    if (HOJAS_ESPECIALES.indexOf(sh.getName()) !== -1) continue;
    var datos = sh.getDataRange().getValues();
    if (datos.length < 2) continue;
    var cab = datos[0];
    for (var i = 1; i < datos.length; i++) {
      var obj = {};
      for (var c = 0; c < cab.length; c++) obj[String(cab[c])] = datos[i][c];
      out.push(obj);
    }
  }
  return out;
}

/* ---------------- REPARACIÓN 1: filas corridas ----------------
   Detecta filas cuya columna "Fecha" es un timestamp de 13 dígitos (firma del
   bug), reconstruye los datos (venían en orden REPORTE_COLS) y los reescribe
   alineados al encabezado en español. NO borra datos: los realinea. */
function repararReportesCorruptos_() {
  var hojas = SS.getSheets();
  var reparadas = 0;
  for (var s = 0; s < hojas.length; s++) {
    var sh = hojas[s];
    if (HOJAS_ESPECIALES.indexOf(sh.getName()) !== -1) continue;
    var last = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (last < 2) continue;
    var cab = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
    if (cab.indexOf('Fecha') !== 0) continue; // solo hojas con encabezado español
    var vals = sh.getRange(2, 1, last - 1, lastCol).getValues();
    for (var i = 0; i < vals.length; i++) {
      var raw = vals[i];
      if (!/^\d{12,}$/.test(String(raw[0]).trim())) continue; // no está corrupta
      var payload = {};
      for (var c = 0; c < REPORTE_COLS.length; c++) payload[REPORTE_COLS[c]] = raw[c];
      var fila = cab.map(function (h) {
        var key = HEADER_MAP[h] || h;
        var v = payload[key];
        return (v !== undefined && v !== null) ? v : '';
      });
      sh.getRange(i + 2, 1, 1, fila.length).setValues([fila]);
      reparadas++;
    }
  }
  return reparadas;
}

/* ---------------- REPARACIÓN 2: códigos como fecha ----------------
   Recupera los códigos (Codigo Siesa/SKU/Consecutivo) que quedaron con formato
   de fecha, revela el número subyacente y fija la columna como texto plano. */
function repararSiesaFechas_() {
  var hojas = SS.getSheets();
  var arregladas = 0;
  for (var s = 0; s < hojas.length; s++) {
    var sh = hojas[s];
    if (HOJAS_ESPECIALES.indexOf(sh.getName()) !== -1) continue;
    var last = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (last < 2) continue;
    var cab = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
    for (var ci = 0; ci < cab.length; ci++) {
      if (COLS_TEXTO.indexOf(cab[ci]) === -1) continue;
      var rng = sh.getRange(2, ci + 1, last - 1, 1);
      var vals = rng.getValues();
      var hayFecha = false;
      for (var i = 0; i < vals.length; i++) {
        if (Object.prototype.toString.call(vals[i][0]) === '[object Date]') { hayFecha = true; break; }
      }
      if (!hayFecha) continue;
      rng.setNumberFormat('0');        // revela el número subyacente (el código real)
      SpreadsheetApp.flush();
      var disp = rng.getDisplayValues();
      rng.setNumberFormat('@');        // texto plano definitivo
      rng.setValues(disp.map(function (row) { return [String(row[0]).trim()]; }));
      SpreadsheetApp.flush();
      arregladas++;
    }
  }
  return arregladas;
}

/* -------------------------- UTIL ----------------------------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
