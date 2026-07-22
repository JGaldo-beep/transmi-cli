# Transmilenio CLI

CLI tool for the Transmilenio system in Bogotá, Colombia.

## Features

- 🔍 **Route Search** - Search routes by name, code, or destination
- 🗺️ **Trip Planner** - Find the best route between origin and destination
- 💳 **Balance Check** - Check TuLlave card balance
- 🎨 **Interactive ASCII Map** - Visualize the system in your terminal
- 📍 **Station Search** - Find stations and stops
- 📢 **Service Alerts** - View operational changes and alerts

## Installation

```bash
bun install
```

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
- **Web Scraping:** agent-browser

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
