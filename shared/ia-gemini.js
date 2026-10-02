/**
 * Asistente IA con Google Gemini
 * Módulo independiente para consultas en lenguaje natural sobre producción
 */

window.AsistenteIA = {
  config: {
    habilitado: false, // SUSPENDIDO temporalmente
    maxReportes: 30,
    timeout: 15000
  },
  
  async consultar(pregunta, reportes) {
    if (!this.config.habilitado) {
      return {ok: false, error: 'Asistente deshabilitado'};
    }
    
    try {
      // Preparar contexto resumido
      const contextoReportes = reportes
        .slice(-this.config.maxReportes)
        .map(r => {
          const prod = Number(r.produccion) || Number(r['Produccion']) || 0;
          const maq = r.maquina || r['Maquina'] || '';
          const ref = r.referencia || r['Referencia'] || '';
          const merma = r.mermaCantidad || r['Merma Cantidad'] || '';
          const tm = r.tiemposMuertosMinutos || r['Tiempo muerto (min)'] || '';
          return `${maq} | ${ref} | ${prod} kg | Merma: ${merma} | TM: ${tm}min`;
        })
        .join('\n');
      
      // Calcular métricas rápidas
      const totalProd = reportes.reduce((s, r) => s + (Number(r.produccion) || Number(r['Produccion']) || 0), 0);
      const numReportes = reportes.length;
      
      const contexto = `RESUMEN:
Total reportes: ${numReportes}
Producción total: ${Math.round(totalProd)} kg

ÚLTIMOS ${this.config.maxReportes} REPORTES:
${contextoReportes}`;
      
      const response = await fetch(window.__CONFIG_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tipo: 'ia',
          pregunta: pregunta,
          contexto: contexto
        })
      });
      
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Error consultando IA:', error);
      return {ok: false, error: 'No se pudo conectar con el asistente. Verifica tu conexión.'};
    }
  },
  
  preguntasSugeridas: [
    "¿Cuál fue la producción total?",
    "¿Qué máquina produjo más?",
    "Muéstrame las mermas principales",
    "¿Cuáles fueron los tiempos muertos?",
    "Dame un resumen general"
  ]
};
