# 🚀 Instalación de Transmilenio CLI

## Requisitos

- **Bun** 1.2+ instalado ([https://bun.sh](https://bun.sh))
- **Claude Code**, **Cursor**, o **Windsurf** (opcional, para usar el MCP server)

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd transmilenio-cli
```

### 2. Instalar dependencias

```bash
bun install
```

### 3. Configurar MCP (Opcional pero recomendado)

#### Opción A: Instalación Automática (Más Fácil) ✨

Ejecuta el script interactivo:

```bash
bun run setup-mcp
```

El script te guiará paso a paso:
1. Detecta automáticamente tu herramienta (Claude Code, Cursor, Windsurf)
2. Te pregunta si quieres instalación global o por proyecto
3. Configura todo automáticamente
4. Te muestra los próximos pasos

#### Opción B: Instalación Manual

Si prefieres hacerlo manualmente o desde Claude Code:

**Desde Claude Code:**
```bash
# En el directorio del proyecto
claude mcp add transmilenio bun run src/mcp/server.ts
```

O usa el comando:
```
/setup-mcp
```

**Para Cursor:**

Crea `.cursor/mcp.json`:
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

**Para Windsurf:**

Crea `.windsurf/mcp.json`:
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

### 4. Activar el MCP

- **Claude Code:** Ejecuta `/reload-plugins`
- **Cursor/Windsurf:** Reinicia la aplicación

## Verificar la instalación

Deberías ver el ícono 🔧 con "transmilenio" y 4 herramientas:
- `search_routes` - Buscar rutas
- `plan_trip` - Planificar viajes
- `get_alerts` - Ver alertas
- `check_balance` - Consultar saldo

## Primeros pasos

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

## Características

- ✅ **1,228 rutas reales** de la API oficial de Transmilenio
- ✅ **245 rutas TransMilenio** (troncales)
- ✅ **Horarios reales** por día (L-V, L-S, D-F)
- ✅ **Información de troncales** (zonas, colores, PDFs)
- ✅ **Caché automático** (24h TTL para mejor performance)
- ✅ **Búsqueda avanzada** por nombre, código y tipo

## Solución de problemas

### El servidor MCP no inicia

```bash
# Verifica que Bun esté instalado
bun --version

# Prueba el servidor directamente
bun run src/mcp/server.ts
```

### No veo las herramientas en mi IDE

- **Claude Code:** Ejecuta `/reload-plugins`
- **Cursor/Windsurf:** Reinicia completamente la aplicación
- Verifica que el archivo de configuración esté en la ubicación correcta

### Error "Cannot find module"

```bash
# Reinstala las dependencias
rm -rf node_modules
bun install
```

## Desinstalar

### Claude Code
```bash
claude mcp remove transmilenio
```

### Cursor/Windsurf
Elimina la entrada `"transmilenio"` del archivo `mcp.json`.

## Desarrollo

### Ejecutar en modo desarrollo
```bash
bun run mcp
```

### Ejecutar tests
```bash
bun test
```

### Linting y formato
```bash
bun run lint
bun run format
```

## Soporte

Si encuentras problemas:
1. Revisa esta guía de instalación
2. Consulta [STATUS.md](./STATUS.md) para ver el estado del proyecto
3. Abre un issue en GitHub

---

**¡Disfruta usando Transmilenio CLI!** 🚍✨
