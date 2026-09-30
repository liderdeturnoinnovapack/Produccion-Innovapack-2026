# Instrucciones: Normalizar Nombres de Operarios

## ✅ Cambios Aplicados

### 1. Formulario de Reporte (Frontend)
- **Antes**: Campo de texto libre para el nombre (permitía errores de digitación)
- **Ahora**: Selector dropdown con los 17 operarios y auxiliares de planta
- **Beneficio**: El cargo se autocompletará según el operario seleccionado, pero se puede ajustar manualmente

### 2. Script de Apps Script (Backend)
- Se agregó la función `normalizarNombresOperarios_()` que corrige automáticamente todas las variaciones de nombres en los reportes existentes

---

## 📝 Cómo Normalizar los Nombres Existentes en el Sheet

### Paso 1: Abrir el Editor de Apps Script
1. Ve a tu Google Sheet de producción
2. Menú: **Extensiones** → **Apps Script**
3. Se abrirá el editor con el código del script

### Paso 2: Actualizar el Código
1. En el editor de Apps Script, **selecciona TODO el código** (Ctrl+A)
2. **Bórralo**
3. Abre el archivo `apps-script/Codigo.gs` de este repositorio
4. **Copia TODO el contenido** del archivo
5. **Pégalo** en el editor de Apps Script
6. Haz clic en **💾 Guardar** (icono de disquete o Ctrl+S)

### Paso 3: Ejecutar la Normalización
1. En la barra superior del editor, busca el selector de función (dice "Seleccionar función")
2. Haz clic y selecciona **`NORMALIZAR_NOMBRES`**
3. Haz clic en el botón **▶️ Ejecutar** (Run)
4. Si es la primera vez:
   - Te pedirá autorización
   - Haz clic en **"Revisar permisos"**
   - Selecciona tu cuenta de Google
   - Haz clic en **"Avanzado"** → **"Ir a [nombre del proyecto] (no seguro)"**
   - Haz clic en **"Permitir"**
5. Espera a que termine la ejecución (puede tardar 1-2 minutos dependiendo de cuántos reportes tengas)
6. Cuando termine, verás en el **registro (Log)** cuántos nombres se normalizaron

### Ejemplo del Log:
```
Nombres normalizados: 245
```

---

## 🎯 Qué hace el Script de Normalización

El script busca en **todas las hojas de máquinas** (Extrusora 1, Extrusora 2, Impresora, Selladora 1, etc.) y normaliza las siguientes variaciones:

| Variaciones Encontradas | → | Nombre Correcto |
|------------------------|---|-----------------|
| jaime taborda, JAIME TABORDA, Jaime taborda | → | **Jaime Taborda** |
| alexander pinto, ALEXANDER PINTO | → | **Alexander Pinto** |
| diego garcia, Diego García, DIEGO GARCIA | → | **Diego Garcia** |
| jesus yara, Jesús Yara, JESUS YARA | → | **Jesus Yara** |
| ... y así para todos los 17 operarios | | |

---

## 🔄 Mantenimiento

### ¿Cuándo ejecutar la normalización?
- **Una vez**: Después de actualizar el código en Apps Script (para limpiar los datos históricos)
- **Ocasionalmente**: Si sospechas que hay nombres mal escritos (aunque con el nuevo dropdown esto ya no debería pasar)

### ¿Necesito volver a ejecutarlo cada vez que hay un reporte nuevo?
**No**. El nuevo formulario con el dropdown ya no permitirá errores de digitación. La normalización es solo para **limpiar los datos históricos** que ya están en el Sheet.

---

## ⚠️ Notas Importantes

1. **El script NO borra datos**: Solo corrige los nombres mal escritos
2. **Es seguro ejecutarlo múltiples veces**: Si no encuentra nombres que normalizar, simplemente reportará `0`
3. **No afecta otras columnas**: Solo modifica la columna "Nombre"
4. **Hojas especiales protegidas**: No toca las hojas `Config`, `Usuarios` ni `Auditoria`

---

## 🚀 Despliegue del Formulario Actualizado

Los cambios ya están en GitHub. Para que los operarios vean el nuevo dropdown:

1. **Recarga la página del formulario** con **Ctrl+F5** (forzar recarga sin caché)
2. Espera **5-10 minutos** para que GitHub Pages aplique los cambios
3. Si no se actualiza, limpia el caché del navegador:
   - Chrome: Ctrl+Shift+Supr → Seleccionar "Imágenes y archivos en caché" → Borrar

---

## 📋 Lista de Operarios y Cargos

| Nombre | Cargo |
|--------|-------|
| Jaime Taborda | Extrusion-Op |
| Alexander Pinto | Extrusion-Op |
| Adris Rios | Aux- Integral |
| Dilan Ramirez | Aux- Integral |
| Jarol Vargas | Aux- Integral |
| Camilo Passos | Aux- Integral |
| Diego Garcia | Op - sellado |
| Yesid Giraldo | Op - sellado |
| Giordan Castaño | Op - sellado |
| Yom Arcia | Op - Impresión |
| Jairo Jimenez | Aux- Impresión |
| Daniel Alvarez | Op - Impresión |
| Juan David Villarreal | Aux- Impresión |
| Jesus Yara | Aux- Integral |
| Laura Ovalle | Aux- Calidad |
| Jesus Ospitia | Aux- Calidad |
| Edwin Chitiva | Aux- Logist |

---

## ❓ ¿Necesitas Agregar o Modificar Operarios?

Si necesitas agregar un nuevo operario o cambiar un cargo:

1. Edita el archivo `shared/config.js` en el repositorio
2. Busca la sección `window.OPERARIOS`
3. Agrega o modifica la entrada correspondiente
4. Actualiza la versión del cache (ej: `v20260827b`)
5. Haz commit y push
6. Actualiza también el script de Apps Script con las nuevas variaciones en la función `normalizarNombresOperarios_()`

---

**Versión**: v20260827a  
**Fecha**: 27 de agosto de 2026
