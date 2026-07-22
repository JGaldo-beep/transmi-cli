# Integración con Claude Desktop (MCP)

Este documento explica cómo configurar transmilenio-cli para que funcione con Claude Desktop a través del Model Context Protocol (MCP).

## ¿Qué es MCP?

MCP (Model Context Protocol) permite que Claude Desktop interactúe directamente con tu CLI como si fuera una herramienta integrada. Puedes pedirle a Claude que busque rutas, planee viajes, o consulte tu saldo, y Claude ejecutará los comandos automáticamente.

## Configuración

### 1. Instalar dependencias

Primero, asegúrate de tener las dependencias instaladas:

```bash
bun install
```

### 2. Configurar Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**En Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**En macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**En Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 3. Agregar transmilenio-cli como servidor MCP

Agrega la siguiente configuración al archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "transmilenio": {
      "command": "bun",
      "args": [
        "run",
        "C:\\Users\\galdi\\Desktop\\Proyects\\transmilenio-cli\\src\\mcp\\server.ts"
      ]
    }
  }
}
```

**IMPORTANTE:** Reemplaza la ruta `C:\\Users\\galdi\\Desktop\\Proyects\\transmilenio-cli\\` con la ruta absoluta donde instalaste transmilenio-cli en tu sistema.

**Para macOS/Linux, usa:**
```json
{
  "mcpServers": {
    "transmilenio": {
      "command": "bun",
      "args": [
        "run",
        "/ruta/absoluta/a/transmilenio-cli/src/mcp/server.ts"
      ]
    }
  }
}
```

### 4. Reiniciar Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo.

## Verificar la conexión

1. Abre Claude Desktop
2. Busca el ícono de herramientas (🔧) en la interfaz
3. Deberías ver "transmilenio" con 4 herramientas disponibles:
   - `search_routes` - Buscar rutas
   - `plan_trip` - Planear un viaje
   - `check_balance` - Consultar saldo
   - `get_alerts` - Obtener alertas

## Ejemplos de uso

Una vez configurado, puedes interactuar con Claude de manera natural:

### Ejemplo 1: Buscar rutas
```
Tú: "Busca rutas que vayan a Portal Norte"

Claude: [Ejecuta search_routes("Portal Norte")]
        "He encontrado 3 rutas que van a Portal Norte:
        - B11: Portal Norte - Universidades (Troncal)
        - ..."
```

### Ejemplo 2: Planear un viaje
```
Tú: "¿Cómo llego de Portal Norte a Av. Jiménez?"

Claude: [Ejecuta plan_trip("Portal Norte", "Av. Jiménez")]
        "La mejor ruta es:
        1. Toma la ruta B11 desde Portal Norte...
        2. Haz transbordo en Calle 100...
        ..."
```

### Ejemplo 3: Consultar saldo
```
Tú: "¿Cuál es mi saldo? Mi tarjeta es 1234567890123456"

Claude: [Ejecuta check_balance("1234567890123456")]
        "Tu saldo actual es $15,000 COP..."
```

### Ejemplo 4: Ver alertas
```
Tú: "¿Hay alguna alerta o cambio en el servicio?"

Claude: [Ejecuta get_alerts()]
        "Hay una alerta activa:
        - Cierre estación Av. Jiménez por obras del Metro..."
```

## Herramientas disponibles

### search_routes
Busca rutas por nombre, código o destino.

**Parámetros:**
- `query` (requerido): Término de búsqueda
- `type` (opcional): Tipo de ruta (troncal, alimentador, etc.)

### plan_trip
Planea un viaje entre dos puntos.

**Parámetros:**
- `origin` (requerido): Estación de origen
- `destination` (requerido): Estación de destino
- `optimizeFor` (opcional): 'time' o 'transfers'

### check_balance
Consulta el saldo de una tarjeta TuLlave.

**Parámetros:**
- `cardNumber` (requerido): Número de tarjeta de 16 dígitos

⚠️ **IMPORTANTE:** Claude siempre te pedirá confirmación antes de ejecutar esta herramienta.

### get_alerts
Obtiene alertas y cambios operacionales.

**Parámetros:**
- `route` (opcional): Filtrar por código de ruta

## Solución de problemas

### Claude no muestra las herramientas

1. Verifica que la ruta en `claude_desktop_config.json` sea correcta y absoluta
2. Asegúrate de haber reiniciado Claude Desktop completamente
3. Verifica que Bun esté instalado: `bun --version`
4. Prueba ejecutar el servidor MCP manualmente: `bun run mcp`

### Error al ejecutar herramientas

1. Verifica que todas las dependencias estén instaladas: `bun install`
2. Revisa los logs en la consola de desarrollador de Claude Desktop
3. Asegúrate de que el CLI tenga acceso a internet

### El servidor MCP no responde

Prueba ejecutar el servidor manualmente para ver los errores:

```bash
bun run src/mcp/server.ts
```

Debería mostrar:
```
[transmilenio-mcp] Server running on stdio
[transmilenio-mcp] 4 tools available:
  - search_routes: Search for routes
  - plan_trip: Plan a trip between stations
  - check_balance: Check TuLlave card balance
  - get_alerts: Get service alerts
```

## Desarrollo

Para probar el servidor MCP localmente sin Claude Desktop:

```bash
# Ejecutar el servidor
bun run mcp

# En otra terminal, enviar un request de prueba
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | bun run src/mcp/server.ts
```

## Recursos adicionales

- [Documentación oficial de MCP](https://modelcontextprotocol.io/)
- [MCP SDK para TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Ejemplos de servidores MCP](https://github.com/modelcontextprotocol/servers)
