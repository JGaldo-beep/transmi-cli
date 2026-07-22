#!/usr/bin/env bun
// MCP Server for Transmilenio CLI
// Allows Claude Desktop/API to interact with Transmilenio system

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';

// We'll import the actual implementations once we create them
// For now, these are placeholder functions
async function searchRoutes(query: string, type?: string): Promise<unknown> {
  // TODO: Implement actual route search
  return {
    routes: [
      {
        code: 'B11',
        name: 'Portal Norte - Universidades',
        type: 'troncal',
        status: 'active',
      },
    ],
  };
}

async function planTrip(
  origin: string,
  destination: string,
  optimizeFor?: 'time' | 'transfers'
): Promise<unknown> {
  // TODO: Implement actual trip planning
  return {
    origin,
    destination,
    segments: [
      {
        from: origin,
        to: destination,
        route: 'B11',
        duration: 35,
        stops: 8,
      },
    ],
    transfers: 0,
    totalDuration: 35,
    estimatedCost: 3000,
  };
}

async function checkBalance(cardNumber: string): Promise<unknown> {
  // TODO: Implement actual balance check
  return {
    cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
    balance: 15000,
    status: 'active',
    lastUpdate: new Date().toISOString(),
  };
}

async function getAlerts(route?: string): Promise<unknown> {
  // TODO: Implement actual alerts fetching
  return {
    alerts: [
      {
        title: 'Cierre estación Av. Jiménez',
        description: 'Cerrada por obras del Metro hasta el 30 de julio',
        route: route || 'all',
        active: true,
      },
    ],
  };
}

// Create MCP server
const server = new Server(
  {
    name: 'transmilenio',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
  return {
    tools: [
      {
        name: 'search_routes',
        description:
          'Search for Transmilenio routes by name, code, or destination. Returns route information including code, name, type, and status.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Route name, code, or destination to search for',
            },
            type: {
              type: 'string',
              enum: ['troncal', 'alimentador', 'complementario', 'especial', 'transmi_zonal'],
              description: 'Optional: Filter by route type',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'plan_trip',
        description:
          'Plan a trip from origin to destination in Transmilenio system. Returns optimal route with segments, transfers, duration, and cost.',
        inputSchema: {
          type: 'object',
          properties: {
            origin: {
              type: 'string',
              description: 'Starting station or location',
            },
            destination: {
              type: 'string',
              description: 'Destination station or location',
            },
            optimizeFor: {
              type: 'string',
              enum: ['time', 'transfers'],
              description:
                'Optional: Optimize for fastest time or fewest transfers (default: time)',
            },
          },
          required: ['origin', 'destination'],
        },
      },
      {
        name: 'check_balance',
        description:
          'Check TuLlave card balance. Returns current balance and status. IMPORTANT: Always confirm with user before executing this tool as it requires their card number.',
        inputSchema: {
          type: 'object',
          properties: {
            cardNumber: {
              type: 'string',
              description: 'TuLlave card number (16 digits)',
              pattern: '^[0-9]{16}$',
            },
          },
          required: ['cardNumber'],
        },
      },
      {
        name: 'get_alerts',
        description:
          'Get current service alerts and operational changes for Transmilenio. Returns active alerts, closures, and route changes.',
        inputSchema: {
          type: 'object',
          properties: {
            route: {
              type: 'string',
              description: 'Optional: Filter alerts by specific route code',
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    switch (request.params.name) {
      case 'search_routes': {
        const { query, type } = request.params.arguments as {
          query: string;
          type?: string;
        };
        const result = await searchRoutes(query, type);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'plan_trip': {
        const { origin, destination, optimizeFor } = request.params.arguments as {
          origin: string;
          destination: string;
          optimizeFor?: 'time' | 'transfers';
        };
        const result = await planTrip(origin, destination, optimizeFor);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'check_balance': {
        const { cardNumber } = request.params.arguments as { cardNumber: string };
        const result = await checkBalance(cardNumber);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_alerts': {
        const { route } = request.params.arguments as { route?: string };
        const result = await getAlerts(route);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[transmilenio-mcp] Server running on stdio');
  console.error('[transmilenio-mcp] 4 tools available:');
  console.error('  - search_routes: Search for routes');
  console.error('  - plan_trip: Plan a trip between stations');
  console.error('  - check_balance: Check TuLlave card balance');
  console.error('  - get_alerts: Get service alerts');
}

main().catch((error) => {
  console.error('[transmilenio-mcp] Fatal error:', error);
  process.exit(1);
});
