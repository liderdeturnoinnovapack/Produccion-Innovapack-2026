# 🔧 Instrucciones para Actualizar el Apps Script - VERSIÓN FINAL

## Problema identificado y resuelto

El Apps Script estaba usando nombres de campos **camelCase** que no coincidían con los que espera el frontend. Esto causaba que:
- ❌ Los reportes no se cargaban (devolvía 0 reportes)
- ❌ Las mermas no aparecían
- ❌ Los tiempos muertos no se mostraban desglosados

## Solución aplicada

Se actualizó el Apps Script para que envíe los campos con **nombres legibles** que el frontend reconoce correctamente.

**Antes:**
```javascript
merma: String(row[12])  // ❌ No reconocido
```

**Después:**
```javascript
'Merma Cantidad': String(row[12])  // ✅ Reconocido
```

## 📋 Pasos para actualizar (CRÍTICO)

1. **Abre el editor de Google Apps Script:**
   - Ve a https://script.google.com
   - Busca el proyecto "Reportes de Produccion 2026"
   - O desde el Sheet: **Extensiones → Apps Script**

2. **Selecciona TODO el contenido actual** del archivo `Codigo.gs` (Ctrl+A)

3. **Borra todo** y **pega el contenido completo** del archivo:
   `apps-script/Codigo.gs` (del repositorio actualizado)

4. **Guarda** el proyecto (Ctrl+S o icono 💾)

5. **Implementa una nueva versión:**
   - Click en **"Implementar"** → **"Gestionar implementaciones"**
   - Click en el ✏️ (lápiz) de la implementación activa
   - Cambia a **"Nueva versión"**
   - Descripción: `Fix final: Nombres de campos legibles para mermas y tiempos muertos`
   - Click en **"Implementar"**

6. **Espera 2-3 minutos** para que los cambios se propaguen

7. **Recarga el panel** con Ctrl+F5

## ✅ Qué se corrigió

### Formato de respuesta
- **Antes**: Devolvía array directo `[...]`
- **Después**: Devuelve `{ok: true, reportes: [...]}`
- **Frontend**: Actualizado para soportar ambos formatos

### Nombres de campos
- **Antes**: `merma`, `tiemposMuertosMinutos` (camelCase)
- **Después**: `"Merma Cantidad"`, `"Tiempo muerto (min)"` (legibles)

### Campos que ahora funcionan correctamente:
- ✅ `'Tiempo muerto (min)'` → Minutos de TM (columna O)
- ✅ `'Motivo tiempo muerto'` → Motivos de TM (columna P)
- ✅ `'Merma Cantidad'` → Cantidad de merma (columna M)
- ✅ `'Merma Motivo'` → Motivo de merma (columna N)

## 🔍 Verificación post-actualización

Después de actualizar, verifica que:

1. **Panel General:**
   - ✅ Muestra 583 reportes (o el número actual)
   - ✅ Tarjeta de "Merma Total" muestra un porcentaje
   - ✅ Tarjeta de "Tiempos Muertos" muestra horas

2. **Informe Mensual → Producción:**
   - ✅ Cada máquina muestra sus tiempos muertos individuales
   - ✅ Sección "Top Motivos TM" lista los motivos con horas

3. **Informe Mensual → Tiempos Muertos:**
   - ✅ Top 15 Motivos de Tiempos Muertos con horas y porcentajes
   - ✅ Datos coinciden con el total mostrado en el resumen

4. **Informe Mensual → Mermas:**
   - ✅ Merma por máquina con porcentajes
   - ✅ Top motivos de merma

## 🚨 Si algo falla

Si después de actualizar el panel muestra "0 reportes":

1. Abre la consola del navegador (F12 → Console)
2. Busca errores en rojo
3. Ejecuta: `fetch('URL_DEL_SCRIPT?usuario=jose.cortes&pass=072026').then(r=>r.json()).then(console.log)`
4. Si devuelve `{ok: false, error: ...}`, hay un error de sintaxis en el Apps Script
5. Revisa que hayas copiado **TODO** el contenido del archivo sin truncar

---

**Versión del fix:** 2026-10-01 (final)
**Archivos modificados:** 
- `apps-script/Codigo.gs` (lectura de reportes con nombres legibles)
- `shared/calculos.js` (soporte para formato `{ok, reportes}`)
- `panel/index.html` (logs de debug + fix parseo respuesta)
