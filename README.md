# transmi-cli

Planea viajes en transporte público por Bogotá desde la terminal o desde cualquier agente
compatible con MCP.

[![Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Qué hace

- Acepta direcciones, estaciones, universidades, empresas y nombres de lugares.
- Devuelve varias alternativas ordenadas por tiempo o por cantidad de transbordos.
- Indica dónde caminar, en qué parada tomar cada bus y en qué parada bajarse.
- Busca rutas por nombre o código usando datos de TransMilenio.
- Se integra con Claude Code, Codex, Cursor y Windsurf mediante MCP.
- No abre un navegador ni requiere una API key durante una consulta.

## Ejemplo

```text
¿Cómo llego de Cra 21 #87-22 a UniMonserrate?
Dame la opción más rápida y dime exactamente dónde tomar cada bus.
```

Una respuesta incluye instrucciones como:

```text
1. Camina hasta Br. La Castellana.
2. Toma T11 en Br. La Castellana hasta Estación Av. Chile (4 paradas).
3. Camina hasta Hsp. Infantil San José.
4. Toma 669 hasta Avenida La Esmeralda (2 paradas).
5. Camina hasta el destino.
```

## Instalación

### Requisitos

- [Bun](https://bun.sh) 1.2 o superior.
- Acceso a internet para consultar rutas.
- Un cliente MCP es opcional; la CLI también funciona por sí sola.

```bash
git clone https://github.com/JGaldo-beep/transmi-cli.git
cd transmi-cli
bun install
```

## Uso desde terminal

Planear un viaje:

```bash
bun run dev -- viaje "Cra 21 #87-22" "UniMonserrate"
```

Priorizar menos transbordos y mostrar hasta cinco alternativas:

```bash
bun run dev -- viaje "Portal Norte" "Universidad Nacional" \
  --optimizar transbordos --alternativas 5
```

Buscar rutas:

```bash
bun run dev -- rutas "Portal Norte"
```

## Uso con agentes de IA

Ejecuta el instalador interactivo:

```bash
bun run setup-mcp
```

El instalador detecta Claude Code, Codex, Cursor o Windsurf y registra el servidor MCP.
Después reinicia el agente y pregunta por una ruta con lenguaje natural.

El servidor expone dos herramientas:

| Herramienta | Descripción |
| --- | --- |
| `plan_trip` | Planea un viaje entre dos direcciones o lugares. |
| `search_routes` | Busca rutas de TransMilenio por nombre o código. |

Para comprobar manualmente que el servidor inicia:

```bash
bun run mcp
```

El proceso permanece abierto porque espera solicitudes por `stdio`; no está bloqueado.

## Cómo funciona

`transmi-cli` combina el catálogo de rutas de TransMilenio con resultados de transporte
público de Google Maps Web. La consulta de viajes se realiza por HTTP y la respuesta se
convierte a un formato estable para la CLI y el MCP.

Consulta [Arquitectura y fuentes de datos](./docs/ARCHITECTURE.md) para conocer el diseño,
las decisiones técnicas y las limitaciones.

## Limitaciones

- Google puede cambiar su endpoint web no documentado y romper temporalmente la planificación.
- Los nombres ambiguos pueden resolverse a un lugar distinto; siempre se muestra el origen y
  destino interpretados para que el usuario pueda corregirlos.
- Las alertas operacionales en tiempo real y el saldo de TuLlave no están implementados.
- Esta herramienta no reemplaza información oficial durante cierres o emergencias.

## Desarrollo

```bash
bun test
bun run lint
```

## Roadmap

- Selección interactiva cuando un lugar tenga varias coincidencias.
- Consultas por hora de salida o de llegada.
- Alertas operacionales verificadas.
- Publicación como paquete para instalarlo con un solo comando.

## Aviso

Este proyecto es independiente y no está afiliado con TransMilenio S.A. ni con Google.
Los nombres y marcas pertenecen a sus respectivos propietarios.

## Licencia

[MIT](./LICENSE)
