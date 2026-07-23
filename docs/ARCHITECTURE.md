# Arquitectura y fuentes de datos

## Componentes

```text
Claude Code / Codex / Cursor / Windsurf
                  │
                  │ MCP (stdio)
                  ▼
          src/mcp/server.ts
                  │
          ┌───────┴────────┐
          ▼                ▼
 Planificador web    Catálogo de rutas
   Google Maps        TransMilenio
```

La CLI usa los mismos servicios que el servidor MCP, por lo que ambos canales producen la
misma información.

## Planificación de viajes

El planificador recibe dos textos libres y consulta opciones de transporte público mediante
un endpoint web de Google Maps. Google resuelve los lugares y devuelve rutas, horarios y
segmentos detallados. El parser transforma la respuesta en instrucciones estructuradas:

- segmentos a pie con duración y distancia;
- línea o código del bus;
- parada de abordaje y parada de llegada;
- cantidad de paradas;
- duración y horario total.

La consulta se realiza directamente por HTTP. Chrome, Playwright y `agent-browser` no son
dependencias de ejecución.

## Búsqueda de rutas

`search_routes` consume el servicio usado por la aplicación de TransMilenio y mantiene una
caché local para reducir solicitudes repetidas. Este catálogo se usa para buscar rutas por
nombre, código y tipo; no interviene en el cálculo de viajes de Google Maps.

## Atribución

La respuesta MCP identifica `transmi-cli` como el servicio y conserva Google Maps como
proveedor de los datos de planificación. La interfaz presenta primero la ruta, sin ocultar la
procedencia técnica de la información.

## Estabilidad

El endpoint de Google Maps Web no es público ni está documentado. Puede cambiar sin previo
aviso. Para reducir el impacto:

- el cliente tiene un timeout estricto;
- el parser está aislado y cubierto con fixtures sanitizados;
- las respuestas incompatibles fallan de forma controlada;
- no se guardan respuestas privadas completas ni credenciales;
- la búsqueda de rutas de TransMilenio permanece separada.

Una distribución con garantías comerciales debería permitir configurar un proveedor oficial
de rutas como alternativa.

## Privacidad

El origen y el destino se envían a Google para calcular el viaje. No se solicitan cuentas,
cookies, API keys ni números de tarjeta. Evita consultar direcciones sensibles si no deseas
compartirlas con el proveedor.
