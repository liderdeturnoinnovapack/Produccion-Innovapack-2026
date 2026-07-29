/* ============================================================================
   Produccion Innovapack 2026 — Google Apps Script (backend)
   ----------------------------------------------------------------------------
   Copia versionada del script desplegado como Web App (doGet/doPost).
   NO se ejecuta desde el repo; vive en el editor de Apps Script (Google).

   Endpoints:
   - doGet  ?tipo=login&usuario=&pass=  -> valida usuario -> {ok,nombre,rol}
   - doGet  ?tipo=config                -> devuelve la hoja Config (abierta)
   - doGet  ?tipo=usuarios&usuario=&pass= -> lista de usuarios (SOLO admin, sin pass)
   - doGet  (por defecto)               -> reportes; EXIGE usuario valido
   - doPost {tipo:"registro",...}       -> autoregistro por area (codigo + cupo)
   - doPost {tipo:"config",...}         -> guarda config; permiso segun rol/clave
   - doPost {tipo:"audit",...}          -> registra una fila de auditoria
   - doPost (por defecto)               -> guarda un reporte (operarios, abierto)

   Mantenimiento (ejecutar a mano desde el editor):
   - configurarUsuarios()        -> crea la hoja Usuarios con los 2 admin
   - REPARAR_AHORA()             -> realinea filas de reporte corridas
   - REPARAR_SIESA()             -> recupera codigos que quedaron como fecha

   SEGURIDAD (leer):
   - La clave de admin va como PLACEHOLDER aqui. Ponla real en el editor antes
     de ejecutar configurarUsuarios() y NO la subas al repo publico.
   - Los codigos de area son un filtro simple de registro (adivinables). Para
     mas seguridad cambialos por valores no obvios.
   ========================================================================== */

var SS = SpreadsheetApp.getActiveSpreadsheet();
var HOJAS_ESPECIALES = ['Config', 'Usuarios', 'Auditoria'];

/* ===== USUARIOS Y ROLES ===== */
var ROLES_AUTOREGISTRO = ['logistico', 'administrativo', 'gerencia', 'calidad'];
var CUPO_POR_AREA = 3;
// Codigos de registro por area (cambialos para mas seguridad).
var CODIGOS_AREA = {
  logistico:      'logistica2026',
  administrativo: 'administracion2026',
  gerencia:       'gerencia2026',
  calidad:        'calidad2026'
};
// Claves de config que puede escribir cada rol no-admin (ademas de lo suyo).
var CONFIG_CALIDAD = ['calidad_verif']; // el area de Calidad solo escribe su verificacion
// Claves de config que un LOGISTICO puede escribir (operativo). El resto = solo admin.
// (ajustes_inventario NO va aqui: los ajustes de inventario son solo admin.)
var CONFIG_LOGISTICO = ['despachos', 'pedidos_extra'];

/* Columnas de un reporte (orden camelCase que manda el frontend) — para reparar. */
var REPORTE_COLS = [
  'ts','fecha','fechaTurno','nombre','cargo','maquina','horaInicio','horaFinal','turno',
  'siesa','sku','referencia','unidad','produccion','mermasCantidad','mermasMotivo',
  'tiemposMuertosMinutos','tiemposMuertosMotivo','extraMedida','extraCalibre','extraSentido',
  'extraRolloInicial','extraRolloFinal','extraRollosTotales','extraRollosProducidos',
  'extraPaqueteInicial','extraPaqueteFinal','extraUnidadesPorPaquete','extraSaldo',
  'extraRollos','consecutivo','observaciones','bodega','categoria','sector'
];

// Encabezado en ESPANOL (el que usan las hojas por maquina y lee el panel).
var HEADER_ES = [
  'Fecha','Nombre','Cargo','Maquina','Hora inicio','Hora final','Turno',
  'Codigo Siesa','SKU','Referencia','Unidad','Produccion','Merma Cantidad','Merma Motivo',
  'Tiempo muerto (min)','Motivo tiempo muerto','Medida','Calibre','Sentido',
  'Rollo Inicial','Rollo Final','Rollos Totales','Rollos Producidos',
  'Paquete Inicial','Paquete Final','Unidades x Paquete','Saldo','Rollos Detalle',
  'Fecha Turno','Consecutivo','Observaciones','Bodega','Categoria','Sector'
];

// Mapa: encabezado de la hoja -> clave que manda el frontend.
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

// Columnas que se guardan SIEMPRE como texto (evita que Sheets vuelva fecha un codigo).
var COLS_TEXTO = ['Codigo Siesa','Código Siesa','SKU','Consecutivo'];

/* ================= MANTENIMIENTO (ejecutar a mano) ================= */

// Semilla de usuarios. Ejecutar UNA vez desde el editor.
// IMPORTANTE: reemplaza 'CAMBIAR_EN_EDITOR' por la clave real de admin (ej. 072026)
// antes de ejecutar. No subas la clave real al repo.
function configurarUsuarios() {
  // IMPORTANTE: pon la clave real ENTRE COMILLAS (ej. '072026'). Con comillas se
  // conserva el cero inicial; sin comillas quedaria como numero (72026).
  var CLAVE_ADMIN = 'CAMBIAR_EN_EDITOR';
  var sh = SS.getSheetByName('Usuarios');
  if (!sh) sh = SS.insertSheet('Usuarios');
  sh.clear();
  sh.getRange(1, 1, 5, 5).setNumberFormat('@'); // texto (preserva ceros a la izquierda)
  var filas = [
    ['usuario', 'pass', 'nombre', 'rol', 'activo'],
    ['gabriel.unda', String(CLAVE_ADMIN), 'Gabriel Unda', 'admin', 'SI'],
    ['jose.cortes', String(CLAVE_ADMIN), 'Jose Cortes', 'admin', 'SI']
  ];
  sh.getRange(1, 1, filas.length, 5).setValues(filas);
  Logger.log('Hoja Usuarios lista (2 admin). Los demas se autoregistran por area.');
  return 'OK';
}

function REPARAR_AHORA() { var n = repararReportesCorruptos_(); Logger.log('Filas reparadas: ' + n); return n; }
function REPARAR_SIESA() { var n = repararSiesaFechas_(); Logger.log('Columnas de codigos reparadas: ' + n); return n; }

/* -------------------------- USUARIOS -------------------------- */
function leerUsuarios_() {
  var sh = SS.getSheetByName('Usuarios');
  if (!sh) return [];
  var datos = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < datos.length; i++) {
    var u = String(datos[i][0]).trim();
    if (!u) continue;
    out.push({
      usuario: u,
      pass: String(datos[i][1]),
      nombre: String(datos[i][2] || ''),
      rol: String(datos[i][3] || '').trim().toLowerCase(),
      activo: String(datos[i][4] || '').trim().toUpperCase() !== 'NO'
    });
  }
  return out;
}

// Valida usuario+clave -> {ok, nombre, rol} o {ok:false}.
function validarLogin_(usuario, pass) {
  var u = String(usuario || '').trim().toLowerCase();
  var p = String(pass == null ? '' : pass);
  var lista = leerUsuarios_();
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].usuario.toLowerCase() === u && lista[i].pass === p && lista[i].activo) {
      return { ok: true, nombre: lista[i].nombre, rol: lista[i].rol };
    }
  }
  return { ok: false };
}

function esAdmin_(usuario, pass) {
  var v = validarLogin_(usuario, pass);
  return v.ok && v.rol === 'admin';
}

// Permiso de escritura de config segun rol y clave.
function puedeGuardarConfig_(clave, usuario, pass) {
  var v = validarLogin_(usuario, pass);
  if (!v.ok) return false;
  if (v.rol === 'admin') return true;
  if (v.rol === 'logistico') return CONFIG_LOGISTICO.indexOf(String(clave)) !== -1;
  if (v.rol === 'calidad') return CONFIG_CALIDAD.indexOf(String(clave)) !== -1;
  return false; // administrativo / gerencia: no escriben config
}

// Autoregistro por area (codigo + cupo). Devuelve {ok,nombre,rol} o {ok:false,error}.
function registrarUsuario_(area, codigo, nombre, usuario, pass) {
  area = String(area || '').trim().toLowerCase();
  if (ROLES_AUTOREGISTRO.indexOf(area) === -1) return { ok: false, error: 'Área no válida.' };
  if (String(codigo || '') !== CODIGOS_AREA[area]) return { ok: false, error: 'Código de área incorrecto.' };
  usuario = String(usuario || '').trim();
  nombre = String(nombre || '').trim();
  if (!usuario || !pass || !nombre) return { ok: false, error: 'Completa nombre, usuario y clave.' };
  var lista = leerUsuarios_();
  var enArea = 0;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].usuario.toLowerCase() === usuario.toLowerCase()) return { ok: false, error: 'Ese usuario ya existe.' };
    if (lista[i].rol === area) enArea++;
  }
  if (enArea >= CUPO_POR_AREA) return { ok: false, error: 'El área ' + area + ' ya tiene sus ' + CUPO_POR_AREA + ' cupos.' };
  var sh = SS.getSheetByName('Usuarios');
  if (!sh) { sh = SS.insertSheet('Usuarios'); sh.appendRow(['usuario', 'pass', 'nombre', 'rol', 'activo']); }
  var r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, 5).setNumberFormat('@'); // texto (preserva ceros a la izquierda)
  sh.getRange(r, 1, 1, 5).setValues([[usuario, String(pass), nombre, area, 'SI']]);
  registrarAuditoria_(usuario, 'registro', 'Alta autoregistro rol=' + area);
  return { ok: true, nombre: nombre, rol: area };
}

/* ---------------------------- GET ---------------------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.tipo === 'login') {
    var v = validarLogin_(p.usuario, p.pass);
    if (v.ok) registrarAuditoria_(p.usuario, 'login', 'rol=' + v.rol);
    return json_(v);
  }
  if (p.tipo === 'config') return json_(leerConfig_()); // abierta (form + panel)

  // Lista de usuarios (SOLO admin) para la herramienta "Permisos por usuario".
  // Nunca devuelve la clave (pass), solo usuario/nombre/rol/activo.
  if (p.tipo === 'usuarios') {
    if (!esAdmin_(p.usuario, p.pass)) return json_({ ok: false, error: 'no_autorizado' });
    var us = leerUsuarios_().map(function (u) {
      return { usuario: u.usuario, nombre: u.nombre, rol: u.rol, activo: u.activo };
    });
    return json_({ ok: true, usuarios: us });
  }

  // Lectura de reportes: exige usuario valido.
  if (!validarLogin_(p.usuario, p.pass).ok) return json_({ error: 'no_autorizado' });
  return json_(leerReportes_());
}

/* ---------------------------- POST ---------------------------- */
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }

  if (body.tipo === 'registro') {
    return json_(registrarUsuario_(body.area, body.codigo, body.nombre, body.usuario, body.pass));
  }
  if (body.tipo === 'config') {
    if (!puedeGuardarConfig_(body.clave, body.usuario, body.pass)) {
      return json_({ status: 'error', message: 'Sin permiso para editar esta configuración.' });
    }
    guardarConfig_(body.clave, body.valor);
    registrarAuditoria_(body.usuario || '(?)', 'config', 'clave=' + body.clave);
    return json_({ status: 'ok' });
  }
  if (body.tipo === 'audit') {
    registrarAuditoria_(body.usuario || '(anónimo)', body.evento || 'evento', body.detalle || '');
    return json_({ status: 'ok' });
  }
  guardarReporte_(body); // operarios, abierto
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
// y fuerza texto en las columnas de codigos. Inmune al orden de columnas.
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

/* ---------------- REPARACIÓN 1: filas corridas ---------------- */
function repararReportesCorruptos_() {
  var hojas = SS.getSheets();
  var reparadas = 0;
  for (var s = 0; s < hojas.length; s++) {
    var sh = hojas[s];
    if (HOJAS_ESPECIALES.indexOf(sh.getName()) !== -1) continue;
    var last = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (last < 2) continue;
    var cab = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
    if (cab.indexOf('Fecha') !== 0) continue;
    var vals = sh.getRange(2, 1, last - 1, lastCol).getValues();
    for (var i = 0; i < vals.length; i++) {
      var raw = vals[i];
      if (!/^\d{12,}$/.test(String(raw[0]).trim())) continue;
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

/* ---------------- REPARACIÓN 2: códigos como fecha ---------------- */
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
      rng.setNumberFormat('0');
      SpreadsheetApp.flush();
      var disp = rng.getDisplayValues();
      rng.setNumberFormat('@');
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
