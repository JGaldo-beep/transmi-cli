# Integración con Google Maps

Esta integración permite que transmilenio-cli extraiga rutas directamente de Google Maps usando `agent-browser`, proporcionando la misma información que Google Maps muestra para Colombia.

## ¿Por qué Google Maps?

Google Maps ya tiene toda la infraestructura completa:
- ✅ Geocodificación precisa de direcciones en Bogotá
- ✅ Datos actualizados de rutas TransMilenio y SITP
- ✅ Algoritmos de optimización de rutas
- ✅ Información de horarios y frecuencias
- ✅ Cálculo de transbordos y caminatas

En lugar de reconstruir todo esto desde cero, usamos Google Maps como fuente de verdad.

## Cómo funciona

### 1. Detección automática de direcciones

El sistema detecta automáticamente si le diste una dirección (vs. un nombre de estación):

```javascript
// Direcciones (activa Google Maps)
"Cra 21 #87-22"
"Calle 26 #68-10"
"Av. Caracas #45-20"

// Nombres de estaciones (usa algoritmo interno)
"Portal Norte"
"Av. Jiménez"
"Universidad Nacional"
```

### 2. Extracción con agent-browser

Cuando detecta una dirección:

1. Abre Google Maps en modo headless
2. Busca rutas de transporte público entre origen y destino
3. Extrae todas las opciones de rutas disponibles
4. Parsea los detalles (horarios, rutas de bus, paradas, caminatas)
5. Retorna la información estructurada

### 3. Formato de respuesta

```json
{
  "success": true,
  "origin": "Cra 21 #87-22, Bogotá",
  "destination": "Universidad Nacional, Bogotá",
  "routes": [
    {
      "departureTime": "9:48 p.m.",
      "arrivalTime": "10:42 p.m.",
      "duration": "54 min",
      "summary": "T11 BC917 T163 K16",
      "steps": []
    }
  ]
}
```

## Requisitos

### 1. Instalar agent-browser

```bash
npm i -g agent-browser
agent-browser install
```

### 2. Verificar instalación

```bash
agent-browser --version
# Debería mostrar: agent-browser 0.32.3 o superior
```

## Uso desde MCP

Una vez configurado el MCP server en Claude Desktop:

### Ejemplo 1: Con direcciones

```
Tú: "¿Cómo llego de Cra 7 #32-16 a Calle 26 #68-10?"

Claude: [Usa plan_trip con Google Maps]
        "He encontrado 3 rutas disponibles:

        Ruta 1 (45 min):
        - Salida: 9:30 p.m.
        - Llegada: 10:15 p.m.
        - Rutas: B12, K86

        ..."
```

### Ejemplo 2: Con nombres de estaciones

```
Tú: "¿Cómo llego de Portal Eldorado a Av. Jiménez?"

Claude: [Usa algoritmo interno Dijkstra]
        "Ruta óptima:
        1. Portal Eldorado
        2. Toma ruta K86 (5 paradas)
        3. Transbordo en Av. Chile
        ..."
```

### Ejemplo 3: Mixto

```
Tú: "¿Cómo llego de Cra 21 #87-22 a Portal Norte?"

Claude: [Usa Google Maps porque detecta dirección]
```

## Debugging

### Ver logs del MCP server

Los logs muestran qué método se está usando:

```
[INFO] [MCP] Planning trip: Cra 21 #87-22 → UNIMONSERRATE
[INFO] [MCP] Detected address input, using Google Maps
[INFO] [Google Maps] Planning trip: Cra 21 #87-22 → UNIMONSERRATE
[INFO] [Google Maps] Opening: https://www.google.com/maps/dir/...
[INFO] [Google Maps] Page loaded, extracting routes...
[SUCCESS] [Google Maps] Extracted 3 routes
```

### Probar manualmente

```bash
# Ejecutar el script de prueba
bun run test-google-maps.ts

# O probar directamente con agent-browser
agent-browser open "https://www.google.com/maps/dir/Portal+Norte/Universidad+Nacional/@4.6533,-74.0836,12z/data=!3m1!4b1!4m2!4m1!3e3"
agent-browser wait --load networkidle
agent-browser snapshot -i
```

### Errores comunes

#### 1. "agent-browser: command not found"

**Solución:**
```bash
npm i -g agent-browser
agent-browser install
```

#### 2. "Google Maps no pudo calcular una ruta en transporte público"

**Causa:** La dirección no es reconocida o no hay rutas disponibles

**Solución:**
- Usa direcciones más específicas: "Cra 7 #32-16, Bogotá"
- Verifica que la dirección exista en Google Maps
- Como alternativa, usa nombres de estaciones conocidas

#### 3. "Browser timeout"

**Causa:** Google Maps tardó demasiado en cargar

**Solución:**
- Verifica tu conexión a internet
- Reinicia el servidor MCP
- Cierra instancias abiertas de agent-browser: `agent-browser close --all`

## Arquitectura

```
┌─────────────────────┐
│   Claude Desktop    │
│   "Cra 21 → Uni"    │
└──────────┬──────────┘
           │ MCP
           ▼
┌─────────────────────┐
│   MCP Server        │
│  detecta dirección  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ google-maps-planner │
│   agent-browser     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Google Maps       │
│  (modo headless)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Rutas extraídas    │
│    y formateadas    │
└─────────────────────┘
```

## Ventajas

1. **Datos actualizados**: Google Maps siempre tiene la información más reciente
2. **Geocodificación robusta**: Reconoce direcciones en cualquier formato
3. **Algoritmos optimizados**: Mejores rutas que un algoritmo custom
4. **Sin mantenimiento**: No necesitas actualizar datos de estaciones/rutas
5. **Fallback automático**: Si Google Maps falla, usa el algoritmo interno

## Limitaciones

1. **Requiere internet**: No funciona offline
2. **Latencia**: Toma ~3-5 segundos extraer rutas (vs <1s del algoritmo interno)
3. **Dependencia externa**: Si Google Maps cambia su UI, puede fallar
4. **Rate limiting**: Google Maps puede bloquear requests excesivos

## Próximos pasos

- [ ] Extraer pasos detallados de cada ruta (walk segments, transfer points)
- [ ] Cachear rutas populares para reducir latencia
- [ ] Soporte para horarios específicos ("salir a las 8am")
- [ ] Mapeo de líneas de bus a códigos TransMilenio
- [ ] Visualización de rutas en un mapa ASCII

## Referencias

- [agent-browser documentation](https://agent-browser.dev)
- [Google Maps Directions API](https://developers.google.com/maps/documentation/directions)
- [TransMilenio API](https://ms-transmiapp-rm2xahnybq-uk.a.run.app/api/v1)
