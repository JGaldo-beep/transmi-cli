# Integración de rutas con Google Maps Web

`transmilenio-cli` consulta opciones de transporte público de Google Maps sin abrir un
navegador y sin requerir una API key del usuario.

## Flujo

1. El MCP recibe dos textos: direcciones, estaciones, empresas o lugares.
2. El cliente llama directamente al endpoint web anónimo de direcciones.
3. Google resuelve ambos textos y calcula las alternativas de transporte público.
4. El CLI devuelve los lugares resueltos, horarios, duración, buses y caminatas.

Ejemplo:

```text
plan_trip(
  origin: "Cra 21 #87-22",
  destination: "UNI Monserrate",
  optimizeFor: "time"
)
```

La respuesta incluye `resolvedOrigin` y `resolvedDestination`. El agente debe mostrarlos
al usuario para que pueda corregir una selección ambigua con una nueva consulta más
específica.

## Rendimiento

- No inicia Chrome, Playwright ni `agent-browser` durante una consulta.
- Una consulta real normalmente tarda entre 2 y 4 segundos.
- El timeout es de 8 segundos.
- `optimizeFor: "time"` ordena por duración.
- `optimizeFor: "transfers"` prioriza menos cambios de vehículo.

## Papel de agent-browser

`agent-browser` se usa únicamente durante desarrollo para capturar tráfico y verificar
cambios en Google Maps. No es una dependencia de ejecución del CLI o del servidor MCP.

## Fuente y estabilidad

La integración usa un endpoint web privado y no documentado de Google. No contiene
credenciales ni copia claves de Mapas Bogotá, pero Google puede cambiar el formato o
limitar el acceso en cualquier momento. Por eso:

- el parser está aislado y cubierto con pruebas;
- las respuestas incompatibles fallan de forma controlada;
- no se persisten respuestas privadas completas;
- los datos oficiales de TransMilenio siguen respaldando `search_routes`.

Para un despliegue con garantías comerciales se recomienda ofrecer también un proveedor
configurable basado en una API oficial.

## Pruebas

```bash
bun test tests/google-maps-planner.test.ts
```

El test usa fixtures sanitizados y no realiza llamadas a Google.
