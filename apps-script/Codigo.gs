// ============================================================
// CONFIGURACIÓN
// ============================================================

const HOJA_USUARIOS = 'Usuarios';
const HOJA_AUDITORIA = 'Auditoria';
const HOJA_CONFIG = 'Config';

// ============================================================
// doGet - Lectura (GET)
// ============================================================

function doGet(e) {
  const tipo = e.parameter.tipo;
  const usuario = e.parameter.usuario || '';
  const pass = e.parameter.pass || '';
  
  try {
    // ========== ENDPOINTS PÚBLICOS (sin autenticación) ==========
    
    // Login: validar credenciales
    if (tipo === 'login') {
      return validarLogin(usuario, pass);
    }
    
    // Config: lectura de configuración (usada por el formulario)
    if (tipo === 'config') {
      return leerConfig();
    }
    
    // Pedidos: lectura de pedidos
    if (tipo === 'pedidos') {
      return leerPedidos();
    }
    
    // ========== LECTURA DE REPORTES (AHORA PÚBLICO) ==========
    
    // Reportes por máquina: ?maquina=Extrusora 1
    const maquina = e.parameter.maquina;
    if (maquina) {
      return leerReportesMaquina(maquina);
    }
    
    // Reportes de todas las máquinas (panel general)
    return leerTodosReportes();
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// doPost - Escritura (POST)
// ============================================================

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const tipo = params.tipo;
    const usuario = params.usuario || '';
    const pass = params.pass || '';
    
    // ========== ESCRITURA DE CONFIG: requiere ROL ADMIN ==========
    
    if (tipo === 'config') {
      // Validar que el usuario sea admin
      const validacion = validarCredenciales(usuario, pass);
      if (!validacion.ok) {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          error: 'no_autorizado'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      if (validacion.rol !== 'admin') {
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          error: 'requiere_rol_admin'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Escribir config
      return escribirConfig(params, usuario);
    }
    
    // ========== AUDITORÍA: escritura libre ==========
    
    if (tipo === 'audit') {
      return registrarAuditoria(params);
    }
    
    // ========== GUARDAR REPORTE: PÚBLICO (operarios sin login) ==========
    
    // Por defecto: guardar reporte (operarios)
    return guardarReporte(params);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// AUTENTICACIÓN
// ============================================================

function validarLogin(usuario, pass) {
  const validacion = validarCredenciales(usuario, pass);
  
  if (validacion.ok) {
    // Registrar login en auditoría
    registrarAuditoriaDirecta(usuario, 'login', 'Login exitoso');
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      nombre: validacion.nombre,
      rol: validacion.rol
    })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'credenciales_invalidas'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function validarCredenciales(usuario, pass) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_USUARIOS);
    
    if (!sheet) {
      return { ok: false };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Buscar usuario (fila 2 en adelante, columnas: usuario | pass | nombre | rol | activo)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const user = String(row[0] || '').trim();
      const password = String(row[1] || '').trim();
      const nombre = String(row[2] || '').trim();
      const rol = String(row[3] || '').trim().toLowerCase();
      const activo = String(row[4] || '').trim().toLowerCase();
      
      if (user === usuario && password === pass && activo === 'si') {
        return { ok: true, nombre: nombre, rol: rol };
      }
    }
    
    return { ok: false };
    
  } catch (e) {
    return { ok: false };
  }
}

// ============================================================
// LECTURA DE REPORTES (PÚBLICO) - ESTRUCTURA COMPLETA 43 COLUMNAS
// ============================================================

function leerReportesMaquina(maquina) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(maquina);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'maquina_no_encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const reportes = [];
    
    // Omitir fila de encabezados (fila 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Construir objeto reporte con las 43 columnas
      const reporte = {
        fecha: parseFecha(row[0]),                    // A: Fecha
        operario: String(row[1] || '').trim(),        // B: Nombre
        cargo: String(row[2] || '').trim(),           // C: Cargo
        maquina: String(row[3] || '').trim(),         // D: Maquina
        horaInicio: String(row[4] || '').trim(),      // E: Hora inicio
        horaFinal: String(row[5] || '').trim(),       // F: Hora final
        turno: String(row[6] || '').trim(),           // G: Turno
        codigoSiesa: String(row[7] || '').trim(),     // H: Codigo Siesa
        sku: String(row[8] || '').trim(),             // I: SKU
        referencia: String(row[9] || '').trim(),      // J: Referencia
        unidad: String(row[10] || '').trim(),         // K: Unidad
        produccion: Number(row[11]) || 0,             // L: Produccion
        merma: String(row[12] || '').trim(),          // M: Merma Cantidad
        mermaMotivo: String(row[13] || '').trim(),    // N: Merma Motivo
        tiempoMuerto: String(row[14] || '').trim(),   // O: Tiempo muerto (min)
        motivoTM: String(row[15] || '').trim(),       // P: Motivo tiempo muerto
        medida: String(row[16] || '').trim(),         // Q: Medida
        calibre: String(row[17] || '').trim(),        // R: Calibre
        sentido: String(row[18] || '').trim(),        // S: Sentido
        rolloInicial: String(row[19] || '').trim(),   // T: Rollo Inicial
        rolloFinal: String(row[20] || '').trim(),     // U: Rollo Final
        rollosTotales: String(row[21] || '').trim(),  // V: Rollos Totales
        rollosProducidos: String(row[22] || '').trim(),// W: Rollos Producidos
        paqueteInicial: String(row[23] || '').trim(), // X: Paquete Inicial
        paqueteFinal: String(row[24] || '').trim(),   // Y: Paquete Final
        unidadesXPaquete: String(row[25] || '').trim(),// Z: Unidades x Paquete
        saldo: String(row[26] || '').trim(),          // AA: Saldo
        rollosDetalle: String(row[27] || '').trim(),  // AB: Rollos Detalle
        fechaTurno: parseFecha(row[28]),              // AC: Fecha Turno
        consecutivo: String(row[29] || '').trim(),    // AD: Consecutivo
        observaciones: String(row[30] || '').trim(),  // AE: Observaciones
        bodega: String(row[31] || '').trim(),         // AF: Bodega
        categoria: String(row[32] || '').trim(),      // AG: Categoria
        sector: String(row[33] || '').trim(),         // AH: Sector
        duracionTurno: String(row[34] || '').trim(),  // AI: Duracion Turno (min)
        tiempoTrabajado: String(row[35] || '').trim(),// AJ: Tiempo Trabajado (min)
        tiemposMuertos: String(row[36] || '').trim(), // AK: Tiempos Muertos (min)
        tiempoProductivo: String(row[37] || '').trim(),// AL: Tiempo Productivo (min)
        utilizacion: String(row[38] || '').trim(),    // AM: % Utilizacion
        rendimientoReal: String(row[39] || '').trim(),// AN: Rendimiento Real
        rendimientoMeta: String(row[40] || '').trim(),// AO: Rendimiento Meta
        unidadRendimiento: String(row[41] || '').trim(),// AP: Unidad Rendimiento
        porcentajeRendimiento: String(row[42] || '').trim() // AQ: % Rendimiento
      };
      
      // Validar que tenga al menos fecha y referencia antes de agregar
      if (reporte.fecha && reporte.referencia) {
        reportes.push(reporte);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      reportes: reportes
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function leerTodosReportes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const maquinas = ['Extrusora 1', 'Extrusora 2', 'Extrusora 3', 'Refiladora', 'Impresora', 'Selladora 1', 'Selladora 2'];
    const todosReportes = [];
    
    maquinas.forEach(maquina => {
      const sheet = ss.getSheetByName(maquina);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        
        // Omitir fila de encabezados
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          
          // Construir objeto reporte con las 43 columnas
          const reporte = {
            fecha: parseFecha(row[0]),
            operario: String(row[1] || '').trim(),
            cargo: String(row[2] || '').trim(),
            maquina: String(row[3] || '').trim(),
            horaInicio: String(row[4] || '').trim(),
            horaFinal: String(row[5] || '').trim(),
            turno: String(row[6] || '').trim(),
            codigoSiesa: String(row[7] || '').trim(),
            sku: String(row[8] || '').trim(),
            referencia: String(row[9] || '').trim(),
            unidad: String(row[10] || '').trim(),
            produccion: Number(row[11]) || 0,
            merma: String(row[12] || '').trim(),
            mermaMotivo: String(row[13] || '').trim(),
            tiempoMuerto: String(row[14] || '').trim(),
            motivoTM: String(row[15] || '').trim(),
            medida: String(row[16] || '').trim(),
            calibre: String(row[17] || '').trim(),
            sentido: String(row[18] || '').trim(),
            rolloInicial: String(row[19] || '').trim(),
            rolloFinal: String(row[20] || '').trim(),
            rollosTotales: String(row[21] || '').trim(),
            rollosProducidos: String(row[22] || '').trim(),
            paqueteInicial: String(row[23] || '').trim(),
            paqueteFinal: String(row[24] || '').trim(),
            unidadesXPaquete: String(row[25] || '').trim(),
            saldo: String(row[26] || '').trim(),
            rollosDetalle: String(row[27] || '').trim(),
            fechaTurno: parseFecha(row[28]),
            consecutivo: String(row[29] || '').trim(),
            observaciones: String(row[30] || '').trim(),
            bodega: String(row[31] || '').trim(),
            categoria: String(row[32] || '').trim(),
            sector: String(row[33] || '').trim(),
            duracionTurno: String(row[34] || '').trim(),
            tiempoTrabajado: String(row[35] || '').trim(),
            tiemposMuertos: String(row[36] || '').trim(),
            tiempoProductivo: String(row[37] || '').trim(),
            utilizacion: String(row[38] || '').trim(),
            rendimientoReal: String(row[39] || '').trim(),
            rendimientoMeta: String(row[40] || '').trim(),
            unidadRendimiento: String(row[41] || '').trim(),
            porcentajeRendimiento: String(row[42] || '').trim()
          };
          
          // Validar que tenga al menos fecha y referencia
          if (reporte.fecha && reporte.referencia) {
            todosReportes.push(reporte);
          }
        }
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      reportes: todosReportes
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// LECTURA DE CONFIG (PÚBLICO)
// ============================================================

function leerConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'hoja_config_no_encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    // Leer pares clave/valor (columnas A=clave, B=valor JSON)
    for (let i = 1; i < data.length; i++) {
      const clave = String(data[i][0] || '').trim();
      const valorStr = String(data[i][1] || '').trim();
      
      if (clave) {
        try {
          config[clave] = JSON.parse(valorStr);
        } catch (e) {
          config[clave] = valorStr;
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      config: config
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// ESCRITURA DE CONFIG (REQUIERE ADMIN)
// ============================================================

function escribirConfig(params, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_CONFIG);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'hoja_config_no_encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const clave = params.clave;
    const valor = params.valor;
    
    if (!clave) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'clave_requerida'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    let filaEncontrada = -1;
    
    // Buscar si ya existe la clave
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim() === clave) {
        filaEncontrada = i + 1; // +1 porque getRange usa 1-indexed
        break;
      }
    }
    
    const valorJSON = JSON.stringify(valor);
    
    if (filaEncontrada > 0) {
      // Actualizar fila existente
      sheet.getRange(filaEncontrada, 2).setValue(valorJSON);
    } else {
      // Agregar nueva fila
      sheet.appendRow([clave, valorJSON]);
    }
    
    // Registrar en auditoría
    registrarAuditoriaDirecta(usuario, 'config_escritura', `Clave: ${clave}`);
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// LECTURA DE PEDIDOS (PÚBLICO)
// ============================================================

function leerPedidos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pedidos');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'pestaña_pedidos_no_encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const pedidos = [];
    
    // Omitir fila de encabezados (fila 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Columnas: A=fecha, B=pedido, C=cliente, D=item, E=resumen, F=pedida, G=pendiente
      const fecha = parseFecha(row[0]);
      const pedido = String(row[1] || '').trim();
      const cliente = String(row[2] || '').trim();
      const item = String(row[3] || '').trim();
      const resumen = String(row[4] || '').trim();
      const pedida = Number(row[5]) || 0;
      const pendiente = Number(row[6]) || 0;
      
      // Validar que al menos tenga pedido, item y pedida > 0
      if (pedido && item && pedida > 0) {
        pedidos.push({
          fecha: fecha,
          pedido: pedido,
          cliente: cliente,
          item: item,
          resumen: resumen,
          pedida: pedida,
          pendiente: pendiente
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      pedidos: pedidos
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// GUARDAR REPORTE (PÚBLICO - operarios sin login)
// ============================================================

function guardarReporte(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const maquina = params.maquina;
    const sheet = ss.getSheetByName(maquina);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'maquina_no_encontrada'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Construir fila según la estructura de 43 columnas
    const fila = [
      params.fecha || '',
      params.operario || '',
      params.cargo || '',
      params.maquina || '',
      params.horaInicio || '',
      params.horaFinal || '',
      params.turno || '',
      params.codigoSiesa || '',
      params.sku || '',
      params.referencia || '',
      params.unidad || '',
      params.produccion || 0,
      params.merma || '',
      params.mermaMotivo || '',
      params.tiempoMuerto || '',
      params.motivoTM || '',
      params.medida || '',
      params.calibre || '',
      params.sentido || '',
      params.rolloInicial || '',
      params.rolloFinal || '',
      params.rollosTotales || '',
      params.rollosProducidos || '',
      params.paqueteInicial || '',
      params.paqueteFinal || '',
      params.unidadesXPaquete || '',
      params.saldo || '',
      params.rollosDetalle || '',
      params.fechaTurno || '',
      params.consecutivo || '',
      params.observaciones || '',
      params.bodega || '',
      params.categoria || '',
      params.sector || '',
      params.duracionTurno || '',
      params.tiempoTrabajado || '',
      params.tiemposMuertos || '',
      params.tiempoProductivo || '',
      params.utilizacion || '',
      params.rendimientoReal || '',
      params.rendimientoMeta || '',
      params.unidadRendimiento || '',
      params.porcentajeRendimiento || ''
    ];
    
    sheet.appendRow(fila);
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// AUDITORÍA
// ============================================================

function registrarAuditoria(params) {
  try {
    const usuario = params.usuario || 'sistema';
    const evento = params.evento || '';
    const detalle = params.detalle || '';
    
    return registrarAuditoriaDirecta(usuario, evento, detalle);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function registrarAuditoriaDirecta(usuario, evento, detalle) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(HOJA_AUDITORIA);
    
    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(HOJA_AUDITORIA);
      sheet.appendRow(['Timestamp', 'Fecha', 'Usuario', 'Evento', 'Detalle']);
    }
    
    const ahora = new Date();
    const fecha = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    
    sheet.appendRow([
      ahora.getTime(),
      fecha,
      usuario,
      evento,
      detalle
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      ok: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// UTILIDADES
// ============================================================

function parseFecha(valor) {
  // Convierte DD/MM/YYYY o Date object a YYYY-MM-DD
  if (!valor) return '';
  
  try {
    let fecha;
    if (valor instanceof Date) {
      fecha = valor;
    } else {
      // Asume DD/MM/YYYY
      const partes = String(valor).split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mes en JS es 0-indexed
        const anio = parseInt(partes[2], 10);
        fecha = new Date(anio, mes, dia);
      } else {
        fecha = new Date(valor);
      }
    }
    
    // Retornar en formato YYYY-MM-DD
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
    
  } catch (e) {
    return '';
  }
}

// ============================================================
// FUNCIÓN DE CONFIGURACIÓN INICIAL DE USUARIOS (ejecutar UNA VEZ)
// ============================================================

function configurarUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(HOJA_USUARIOS);
  
  if (!sheet) {
    sheet = ss.insertSheet(HOJA_USUARIOS);
  }
  
  // Limpiar y crear encabezados
  sheet.clear();
  sheet.appendRow(['usuario', 'pass', 'nombre', 'rol', 'activo']);
  
  // Usuarios iniciales
  sheet.appendRow(['gabriel.unda', '072026', 'Gabriel Unda', 'admin', 'si']);
  sheet.appendRow(['jose.cortes', '072026', 'Jose Cortes', 'admin', 'si']);
  sheet.appendRow(['consulta1', '12345678', 'Usuario Consulta 1', 'lectura', 'si']);
  sheet.appendRow(['consulta2', '12345678', 'Usuario Consulta 2', 'lectura', 'si']);
  
  Logger.log('Usuarios configurados correctamente');
}

// ============================================================
// NORMALIZACIÓN DE NOMBRES (ejecutar manualmente cuando sea necesario)
// ============================================================

function NORMALIZAR_NOMBRES() {
  const cambios = normalizarNombresOperarios();
  Logger.log('Nombres normalizados: ' + cambios);
  return cambios;
}

function normalizarNombresOperarios() {
  // Mapa de variaciones -> nombre correcto
  const NOMBRES_CORRECTOS = {
    'Jaime Taborda': ['jaime taborda', 'JAIME TABORDA', 'Jaime taborda', 'jaime Taborda'],
    'Alexander Pinto': ['alexander pinto', 'ALEXANDER PINTO', 'Alexander pinto', 'alexander Pinto'],
    'Adris Rios': ['adris rios', 'ADRIS RIOS', 'Adris rios', 'adris Rios', 'Adris Ríos', 'adris ríos'],
    'Dilan Ramirez': ['dilan ramirez', 'DILAN RAMIREZ', 'Dilan ramirez', 'dilan Ramirez', 'Dilan Ramírez', 'dilan ramírez'],
    'Jarol Vargas': ['jarol vargas', 'JAROL VARGAS', 'Jarol vargas', 'jarol Vargas'],
    'Camilo Passos': ['camilo passos', 'CAMILO PASSOS', 'Camilo passos', 'camilo Passos'],
    'Diego Garcia': ['diego garcia', 'DIEGO GARCIA', 'Diego garcia', 'diego Garcia', 'Diego García', 'diego garcía'],
    'Yesid Giraldo': ['yesid giraldo', 'YESID GIRALDO', 'Yesid giraldo', 'yesid Giraldo'],
    'Giordan Castaño': ['giordan castaño', 'GIORDAN CASTAÑO', 'Giordan castaño', 'giordan Castaño', 'Giordan Castano', 'giordan castano'],
    'Yom Arcia': ['yom arcia', 'YOM ARCIA', 'Yom arcia', 'yom Arcia'],
    'Jairo Jimenez': ['jairo jimenez', 'JAIRO JIMENEZ', 'Jairo jimenez', 'jairo Jimenez', 'Jairo Jiménez', 'jairo jiménez'],
    'Daniel Alvarez': ['daniel alvarez', 'DANIEL ALVAREZ', 'Daniel alvarez', 'daniel Alvarez', 'Daniel Álvarez', 'daniel álvarez'],
    'Juan David Villarreal': ['juan david villarreal', 'JUAN DAVID VILLARREAL', 'Juan David villarreal', 'juan david Villarreal'],
    'Jesus Yara': ['jesus yara', 'JESUS YARA', 'Jesus yara', 'jesus Yara', 'Jesús Yara', 'jesús yara'],
    'Laura Ovalle': ['laura ovalle', 'LAURA OVALLE', 'Laura ovalle', 'laura Ovalle'],
    'Jesus Ospitia': ['jesus ospitia', 'JESUS OSPITIA', 'Jesus ospitia', 'jesus Ospitia', 'Jesús Ospitia', 'jesús ospitia'],
    'Edwin Chitiva': ['edwin chitiva', 'EDWIN CHITIVA', 'Edwin chitiva', 'edwin Chitiva']
  };
  
  // Crear mapa inverso: variación -> correcto
  const mapa = {};
  for (const correcto in NOMBRES_CORRECTOS) {
    const variaciones = NOMBRES_CORRECTOS[correcto];
    variaciones.forEach(v => {
      mapa[v.toLowerCase()] = correcto;
    });
    // El correcto también mapea a sí mismo
    mapa[correcto.toLowerCase()] = correcto;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const maquinas = ['Extrusora 1', 'Extrusora 2', 'Extrusora 3', 'Refiladora', 'Impresora', 'Selladora 1', 'Selladora 2', 'Selladora Manual'];
  let normalizados = 0;
  
  maquinas.forEach(maquina => {
    const sheet = ss.getSheetByName(maquina);
    if (!sheet) return;
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    
    // La columna B (2) es "Nombre" según la estructura de 43 columnas
    const colNombre = 2;
    const rng = sheet.getRange(2, colNombre, lastRow - 1, 1);
    const valores = rng.getValues();
    let cambios = false;
    
    for (let i = 0; i < valores.length; i++) {
      const nombreActual = String(valores[i][0] || '').trim();
      if (!nombreActual) continue;
      
      const nombreNormalizado = mapa[nombreActual.toLowerCase()];
      if (nombreNormalizado && nombreNormalizado !== nombreActual) {
        valores[i][0] = nombreNormalizado;
        cambios = true;
        normalizados++;
      }
    }
    
    // Guardar cambios si hubo
    if (cambios) {
      rng.setValues(valores);
      SpreadsheetApp.flush();
    }
  });
  
  return normalizados;
}
