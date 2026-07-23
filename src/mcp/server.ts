#!/usr/bin/env bun
// MCP Server for Transmilenio CLI
// Allows Claude Desktop/API to interact with Transmilenio system

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  type CallToolRequest,
  CallToolRequestSchema,
  type ListToolsRequest,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from '@lib/logger.js';
import { planTripWithGoogleMaps } from '@services/planner/google-maps-planner.js';
import { getActiveAlerts, getAlertsByRoute } from '@services/scraper/alerts-scraper.js';
import { searchRoutes as searchRoutesService } from '@services/scraper/routes-scraper.js';

/**
 * Search for routes
 */
async function searchRoutes(query: string, type?: string) {
  logger.info(`[MCP] Searching routes: ${query} ${type ? `(type: ${type})` : ''}`);

  const routes = await searchRoutesService(query, type);

  return {
    success: true,
    count: routes.length,
    routes: routes.map((r) => ({
      code: r.code,
      name: r.name,
      type: r.type,
      status: r.status,
    })),
  };
}

/**
 * Plan a trip between two locations (addresses or station names)
 */
async function planTrip(origin: string, destination: string, optimizeFor?: 'time' | 'transfers') {
  logger.info(
    `[MCP] Planning trip: ${origin} → ${destination} (optimize: ${optimizeFor || 'time'})`
  );

  try {
    // Google Maps resolves addresses, station names, landmarks, and ambiguous place names.
    const googleMapsTrip = await planTripWithGoogleMaps(origin, destination, optimizeFor);
    return {
      success: googleMapsTrip.success,
      source: 'transmi-cli',
      dataProvider: 'Google Maps',
      trip: googleMapsTrip.success ? googleMapsTrip : undefined,
      error: googleMapsTrip.error,
    };
  } catch (error) {
    logger.error('[MCP] Trip planning error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check TuLlave card balance
 */
async function checkBalance(cardNumber: string) {
  logger.info(`[MCP] Checking balance for card ending in ${cardNumber.slice(-4)}`);

  // TODO: Implement actual balance check with web scraping
  // For now, return mock data
  return {
    success: true,
    cardNumber: cardNumber.replace(/\d(?=\d{4})/g, '*'),
    balance: 15000,
    status: 'active',
    lastUpdate: new Date().toISOString(),
    message: 'Balance check via web scraping not yet implemented',
  };
}

/**
 * Get service alerts
 */
async function getAlerts(route?: string) {
  logger.info(`[MCP] Getting alerts${route ? ` for route ${route}` : ''}`);

  const alerts = route ? await getAlertsByRoute(route) : await getActiveAlerts();

  return {
    success: true,
    count: alerts.length,
    alerts: alerts.map((a) => ({
      title: a.title,
      description: a.description,
      route: a.route,
      active: a.active,
      type: a.type,
      startDate: a.startDate,
      endDate: a.endDate,
    })),
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
          'Plan a public-transit trip in Bogotá. Origin and destination may be addresses, stations, businesses, universities, or landmarks. Returns resolved places, alternatives, exact boarding and arrival stops, times, buses, and walking steps. Lead the user response with the route; mention the underlying data provider only if asked.',
        inputSchema: {
          type: 'object',
          properties: {
            origin: {
              type: 'string',
              description:
                'Starting location: can be a full address (e.g., "Cra 21 #87-22, Bogotá") or a station name (e.g., "Portal Norte")',
            },
            destination: {
              type: 'string',
              description:
                'Destination location: can be a full address (e.g., "Calle 80 #81a-02") or a station name (e.g., "Calle 85")',
            },
            optimizeFor: {
              type: 'string',
              enum: ['time', 'transfers'],
              description:
                'Optional: Order alternatives by fastest time or fewest vehicle changes (default: time)',
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
    logger.error('[MCP] Tool execution error:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: errorMessage }, null, 2),
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

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  Transmilenio MCP Server');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('✓ Server running on stdio');
  logger.info('✓ 4 tools available:');
  logger.info('  • search_routes - Search for routes');
  logger.info('  • plan_trip - Plan a trip between locations');
  logger.info('  • check_balance - Check TuLlave card balance');
  logger.info('  • get_alerts - Get service alerts');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Ready for Claude Desktop!');
}

main().catch((error) => {
  logger.error('[transmilenio-mcp] Fatal error:', error);
  process.exit(1);
});
