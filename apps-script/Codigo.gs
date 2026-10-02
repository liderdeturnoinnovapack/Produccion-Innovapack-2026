    }
  });
  
  return normalizados;
}


// ============================================================
// ASISTENTE IA CON GEMINI (SUSPENDIDO TEMPORALMENTE)
// ============================================================

/*
function consultarGemini(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const pregunta = params.pregunta || '';
    const contexto = params.contexto || '';
    
    // Obtener API Key desde Properties
    const GEMINI_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'API Key de Gemini no configurada. Ve a Configuración del proyecto → Propiedades del script.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_KEY;
    
    const prompt = `Eres un asistente experto en análisis de producción industrial para Innovapack, una planta de empaques plásticos.

CONTEXTO DEL NEGOCIO:
- Empresa: Innovapack - Producción de empaques plásticos
- Máquinas: Extrusoras (1,2,3), Impresora, Refiladora, Selladoras (1,2,3)
- Métricas principales: Producción (kg/unidades), Mermas, Tiempos Muertos, Eficiencia
- Clasificación: Producto Terminado (PT) vs Producto en Proceso (PP)
- Turnos: Día, Tarde, Noche (8 horas cada uno)

DATOS DE PRODUCCIÓN:
${contexto}

PREGUNTA DEL USUARIO:
${pregunta}

INSTRUCCIONES PARA TU RESPUESTA:
1. Responde de forma concisa y profesional (máximo 150 palabras)
2. Usa datos específicos del contexto cuando estén disponibles
3. Si no hay suficientes datos, indica qué información adicional necesitas
4. Usa emojis solo cuando aporten valor (📊 ✅ ⚠️ 🔴)
5. Si la pregunta es sobre tendencias y solo hay datos de un período, menciona esa limitación
6. Formato: párrafos cortos, usa listas numeradas solo si es necesario

IMPORTANTE: Sé directo, preciso y útil. Evita respuestas genéricas.`;

    const payload = {
      contents: [{
        parts: [{text: prompt}]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500
      }
    };
    
    const options = {
    // ========== ASISTENTE IA CON GEMINI (SUSPENDIDO) ==========
    // if (tipo === 'ia') {
    //   return consultarGemini(e);
    // } muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const respuesta = result.candidates[0].content.parts[0].text;
      
      // Registrar uso en auditoría (opcional)
      try {
        registrarAuditoriaDirecta('asistente-ia', 'consulta', pregunta.substring(0, 100));
      } catch (e) {
        // Silencioso si falla auditoría
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        respuesta: respuesta
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (result.error) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'Error de Gemini: ' + result.error.message
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        ok: false,
        error: 'No se pudo generar una respuesta. Intenta reformular la pregunta.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    Logger.log('Error en consultarGemini: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'Error interno: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
*/