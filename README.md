# Transmilenio CLI

CLI tool for the Transmilenio system in Bogotá, Colombia.

## Start in two minutes

```bash
git clone <repository-url>
cd transmilenio-cli
bun install
bun run setup-mcp
```

The installer configures Claude Code, Codex, Cursor, or Windsurf. Restart the selected
agent and ask:

> ¿Cómo llego de Cra 21 #87-22 a UniMonserrate? Dame la opción más rápida.

You can also try the terminal directly:

```bash
bun run dev -- viaje "Cra 21 #87-22" "UniMonserrate"
```

The result identifies the exact boarding and arrival stops, walking segments, route codes,
durations, and number of stops.

## Features

- 🔍 **Route Search** - Search routes by name, code, or destination
- 🗺️ **Trip Planner** - Find the best route between origin and destination
- 🌐 **Google Maps Integration** - Query public-transit alternatives without a browser or API key
- 💳 **Balance Check** - Check TuLlave card balance
- 🎨 **Interactive ASCII Map** - Visualize the system in your terminal
- 📍 **Station Search** - Find stations and stops
- 📢 **Service Alerts** - View operational changes and alerts
- 🤖 **Claude Desktop Integration** - Use with Claude through MCP (Model Context Protocol)

## Claude Desktop Integration

You can use transmilenio-cli directly from Claude Code, Codex, Cursor, or Windsurf! Just ask naturally:

**Route Search:**
> "Busca rutas de Portal Eldorado"
> "¿Cuántas rutas TransMilenio hay?"
> "Muéstrame rutas que pasan por Suba"

**Trip Planning with Google Maps** 🌐 **NEW!**
> "¿Cómo llego de Cra 7 #32-16 a Calle 26?"
> "Ruta de mi casa (Cra 21 #87-22) al trabajo (Universidad Nacional)"
> "Direcciones de Portal Norte a Av. Caracas #45-20"

The CLI accepts addresses, stations, and place names, then returns the locations Google resolved and the available transit alternatives.

**⚡ Quick Setup:**
```bash
bun install
bun run setup-mcp
```

The interactive installer will detect your environment and configure everything automatically!

**[📖 See INSTALL.md for detailed instructions](./INSTALL.md)**

## Installation

### Quick Start

```bash
# Clone the repository
git clone <url>
cd transmilenio-cli

# Install dependencies
bun install

# Setup MCP (interactive)
bun run setup-mcp

```

**[🗺️ Learn more about Google Maps integration](./GOOGLE-MAPS-INTEGRATION.md)**

### Features

- ✅ **1,228 real routes** from Transmilenio's official API
- ✅ **245 TransMilenio routes** (trunk lines)
- ✅ **Real schedules** by day type (Mon-Fri, Mon-Sat, Sun-Holidays)
- ✅ **Trunk line information** (zones, colors, PDFs)
- ✅ **Automatic caching** (24h TTL for better performance)
- ✅ **Advanced search** by name, code, and type

## Usage

### Development

```bash
bun run dev [command]
```

### Build

```bash
bun run build
```

### Commands

#### Search Routes
```bash
transmi search "Portal Norte"
transmi search "C30" --type troncal
```

#### Plan a Trip
```bash
transmi plan "Portal Norte" "Av. Jiménez"
transmi plan "Suba" "Centro" --time 08:00 --alternatives 3
```

#### Check Balance
```bash
transmi balance 1234567890123456
```

#### View Map
```bash
transmi map --interactive
transmi map "Portal Norte" --route "B11" --legend
```

#### Find Stations
```bash
transmi stops "Portal"
```

#### View Alerts
```bash
transmi alerts
transmi alerts --route "B11"
```

## Tech Stack

- **Runtime:** Bun 1.2+
- **Language:** TypeScript 5.6+
- **CLI Framework:** Commander.js 12+
- **Prompts:** @clack/prompts 0.7+
- **Colors:** picocolors 1.0+
- **Validation:** Zod 3.22+
- **Transit Planning:** Anonymous Google Maps Web client

## Development

### Lint

```bash
bun run lint
bun run lint:fix
```

### Format

```bash
bun run format
```

### Test

```bash
bun test
bun test:watch
```

### Type Check

```bash
bun run type-check
```

## Project Structure

```
transmilenio-cli/
├── bin/
│   └── transmi.ts           # Entry point
├── src/
│   ├── commands/            # CLI commands
│   ├── services/            # Business logic
│   │   ├── scraper/        # Web scraping
│   │   ├── planner/        # Route planning
│   │   ├── cache/          # Caching system
│   │   └── map/            # Map rendering
│   ├── schemas/            # Zod schemas
│   ├── types/              # TypeScript types
│   ├── lib/                # Utilities
│   └── config/             # Configuration
├── data/                   # Local cache
└── tests/                  # Tests
```

## License

MIT
