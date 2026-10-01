# 🔧 Instrucciones para Actualizar el Apps Script

## Problema identificado

El Apps Script estaba usando nombres de campos **antiguos** que no coincidían con los que envía el formulario actual. Por eso los tiempos muertos (y otros datos) no se estaban guardando correctamente en las columnas O y P del Sheet.

## Solución

Se corrigió el archivo `apps-script/Codigo.gs` para mapear correctamente los campos del formulario a las columnas del Sheet.

### Cambios realizados (líneas 519-547):

**ANTES:**
```javascript
params.tiempoMuerto || '',      // ❌ Campo antiguo
params.motivoTM || '',          // ❌ Campo antiguo
params.medida || '',            // ❌ Falta prefijo "extra"
```

**DESPUÉS:**
```javascript
params.tiemposMuertosMinutos || params.tiempoMuerto || '',  // ✅ Nuevo + fallback
params.tiemposMuertosMotivo || params.motivoTM || '',       // ✅ Nuevo + fallback
params.extraMedida || params.medida || '',                  // ✅ Con prefijo correcto
```

## 📋 Pasos para actualizar

1. Abre el editor de **Google Apps Script**:
   - Ve a https://script.google.com
   - Busca el proyecto "Reportes de Produccion 2026"
   - O desde el Sheet: **Extensiones → Apps Script**

2. Selecciona todo el contenido del archivo `Codigo.gs`

3. **Reemplázalo** con el contenido del archivo actualizado:
   - Abre el archivo: `apps-script/Codigo.gs` en este repositorio
   - Copia TODO el contenido
   - Pégalo en el editor de Apps Script

4. **Guarda** el proyecto (Ctrl+S o icono 💾)

5. **Implementa** una nueva versión:
   - Click en **"Implementar"** → **"Gestionar implementaciones"**
   - Click en el ✏️ (lápiz) de la implementación activa
   - Cambia a **"Nueva versión"**
   - Agrega descripción: `Fix: Corregir mapeo de campos tiempos muertos`
   - Click en **"Implementar"**

6. Espera 1-2 minutos para que los cambios se propaguen

7. **Prueba** ingresando un nuevo reporte desde el formulario con tiempos muertos

## ✅ Qué se corrigió

### Tiempos Muertos
- **Columna O** ahora guarda correctamente los minutos: `15min + 80min`
- **Columna P** ahora guarda correctamente los motivos: `01 - Tiempo de almuerzo + 02 - Tiempo de desayuno`

### Otros campos corregidos
- Operario: `params.operario` → `params.nombre` (fallback)
- Código Siesa: `params.codigoSiesa` → `params.siesa` (fallback)
- Mermas: `params.merma` → `params.mermasCantidad` (nuevo formato)
- Campos extra (medida, calibre, rollos, etc.): ahora con prefijo `extra*`

## 🔍 Verificación

Después de actualizar, los reportes nuevos deberían:
- ✅ Mostrar tiempos muertos en la columna O
- ✅ Mostrar motivos de TM en la columna P
- ✅ Aparecer desglosados por máquina en el panel
- ✅ Mostrarse en el Top 15 de motivos de TM

---

**Versión del fix:** 2026-10-01
**Archivo corregido:** `apps-script/Codigo.gs` líneas 519-547
