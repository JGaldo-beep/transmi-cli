# 🚀 Instalación MCP - Guía Completa

Esta es la guía completa para instalar el servidor MCP de Transmilenio CLI en cualquier herramienta de IA (Claude Code, Cursor, Windsurf).

## 🎯 3 Formas de Instalar

### Opción 1: Instalación Automática ⚡ (RECOMENDADO)

La forma más fácil y rápida:

```bash
cd transmilenio-cli
bun run setup-mcp
```

El script interactivo:
- ✅ Detecta automáticamente tu herramienta (Claude Code, Cursor, Windsurf)
- ✅ Te pregunta si quieres instalación global o por proyecto
- ✅ Configura todo automáticamente
- ✅ Te dice exactamente qué hacer después

**Capturas del flujo:**
1. Detecta tu entorno
2. Pregunta alcance (global/proyecto)
3. Confirma instalación
4. Instala y muestra próximos pasos

---

### Opción 2: Comando de Claude Code

Si estás en Claude Code, usa el comando:

```
/setup-mcp
```

Claude Code ejecutará el asistente de instalación automáticamente.

---

### Opción 3: Instalación Manual

Si prefieres configurarlo manualmente:

#### Para Claude Code

```bash
# Global (todos los proyectos)
cd /ruta/a/transmilenio-cli
claude mcp add transmilenio bun run src/mcp/server.ts

# Solo este proyecto
cd /ruta/a/transmilenio-cli
claude mcp add transmilenio --scope project bun run src/mcp/server.ts
```

Luego ejecuta `/reload-plugins` en Claude Code.

#### Para Cursor

Crea `.cursor/mcp.json` en la raíz del proyecto de transmilenio-cli:

```json
{
  "mcpServers": {
    "transmilenio": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts"]
    }
  }
}
```

Reinicia Cursor.

#### Para Windsurf

Crea `.windsurf/mcp.json` en la raíz del proyecto de transmilenio-cli:

```json
{
  "mcpServers": {
    "transmilenio": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts"]
    }
  }
}
```

Reinicia Windsurf.

---

## ✅ Verificar Instalación

Después de instalar, deberías ver:

**En Claude Code / Cursor / Windsurf:**
- Ícono 🔧 con "transmilenio"
- 4 herramientas disponibles:
  - `search_routes` - Buscar entre 1,228 rutas
  - `plan_trip` - Planificar viajes
  - `get_alerts` - Ver alertas
  - `check_balance` - Consultar saldo

---

## 🧪 Probar que Funciona

Prueba estos comandos en tu herramienta de IA:

```
Busca rutas de Portal Eldorado
```

```
¿Cuántas rutas TransMilenio hay en total?
```

```
Muéstrame rutas que pasan por Suba
```

```
Busca solo rutas TransMiZonal
```

Si ves respuestas con datos reales de rutas, ¡funciona!

---

## 🔧 Solución de Problemas

### No veo el ícono 🔧

**Claude Code:**
```bash
/reload-plugins
```

**Cursor/Windsurf:**
- Reinicia completamente la aplicación
- Verifica que el archivo `mcp.json` esté en la ubicación correcta

### Error: "Cannot find module" o "Command not found"

```bash
# Verifica que Bun esté instalado
bun --version

# Si no está instalado, instálalo
# Windows (PowerShell):
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS/Linux:
curl -fsSL https://bun.sh/install | bash
```

### El servidor no responde

```bash
# Prueba ejecutar el servidor manualmente
cd /ruta/a/transmilenio-cli
bun run src/mcp/server.ts
```

Si ves:
```
[INFO] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO]   Transmilenio MCP Server
[INFO] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] ✓ Server running on stdio
[INFO] Ready for Claude Desktop!
```

El servidor funciona correctamente.

### Reinstalar dependencias

```bash
cd /ruta/a/transmilenio-cli
rm -rf node_modules
bun install
```

---

## 🗑️ Desinstalar

### Claude Code
```bash
claude mcp remove transmilenio
```

### Cursor / Windsurf
Edita el archivo `mcp.json` y elimina la entrada `"transmilenio"`.

---

## 📦 ¿Qué incluye el servidor MCP?

- ✅ **1,228 rutas reales** de la API oficial de Transmilenio
- ✅ **245 rutas TransMilenio** (troncales)
- ✅ **Horarios reales** por tipo de día (L-V, L-S, D-F)
- ✅ **Información de troncales** (zonas, colores, PDFs)
- ✅ **Sistema de caché** (24h TTL para mejor performance)
- ✅ **Búsqueda avanzada** por nombre, código y tipo

---

## 💡 Tips

1. **Primera consulta es lenta** (~2-3 segundos) - descarga todas las rutas
2. **Consultas siguientes son rápidas** (<100ms) - usa caché
3. **El caché dura 24 horas** - después actualiza datos automáticamente
4. **Combina filtros** - "Busca rutas TransMilenio que incluyan Portal"

---

## 📞 Soporte

¿Problemas? Revisa:
1. Esta guía completa
2. [INSTALL.md](./INSTALL.md) para más detalles
3. [STATUS.md](./STATUS.md) para ver el estado actual
4. Abre un issue en GitHub

---

**¡Disfruta usando Transmilenio CLI con tu herramienta de IA favorita!** 🚍✨
