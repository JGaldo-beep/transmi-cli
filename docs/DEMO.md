# Demo y publicación

## Video recomendado

Graba una demo de 60 a 75 segundos con OBS Studio, Screen Studio o la grabadora del
sistema. Usa una terminal limpia, texto grande y oculta notificaciones.

### Guion

**0-8 s: problema**

> Encontrar una ruta de TransMilenio normalmente implica abrir otra aplicación y copiar
> direcciones. Quería poder preguntarlo directamente a mi agente de IA.

**8-18 s: instalación**

```bash
bun install
bun run setup-mcp
```

Muestra que el instalador detecta Claude Code o Codex.

**18-45 s: consulta principal**

Escribe en el agente:

> ¿Cómo llego de Cra 21 #87-22 a UniMonserrate? Dame la ruta más rápida y dime exactamente
> en qué parada tomar y dejar cada bus.

Resalta el lugar que Google resolvió, la duración, la parada de abordaje, el bus y la parada
de llegada.

**45-58 s: segunda interacción**

> Ahora ordénalas por menos transbordos.

Esto demuestra que no es una respuesta estática y que el MCP puede reutilizarse durante la
conversación.

**58-75 s: cierre**

> Esto es transmi-cli: una CLI y servidor MCP open source para consultar rutas de Bogotá
> desde Claude Code, Codex y otros clientes compatibles.

Termina mostrando el repositorio y el comando de instalación.

## Consejos de grabación

- Resolución horizontal de 1920x1080 para YouTube y LinkedIn.
- Haz también una versión vertical de menos de 60 segundos para Reels, Shorts o TikTok.
- Usa una fuente de terminal de al menos 20 px.
- Ejecuta una consulta antes de grabar para comprobar la conexión.
- No muestres rutas personales sensibles, tokens, archivos de configuración ni notificaciones.
- Añade subtítulos; muchas personas ven estos videos sin audio.

## Texto sugerido para el post

> Construí transmi-cli, una herramienta open source para consultar rutas de transporte
> público en Bogotá directamente desde Claude Code, Codex y otros clientes MCP.
>
> Puedes escribir una dirección o un lugar, obtener varias alternativas y saber exactamente
> dónde tomar y dejar cada bus. El runtime no abre un navegador y no requiere que cada usuario
> configure una API key.
>
> Stack: Bun, TypeScript y Model Context Protocol.
>
> Repositorio y guía de instalación: [enlace]

## Fuente de datos y marca

La experiencia debe presentarse como **transmi-cli**. Conserva `dataProvider: "Google Maps"`
en la respuesta técnica por transparencia, pero no hace falta encabezar cada respuesta con
el proveedor. La ruta y las instrucciones deben aparecer primero.
