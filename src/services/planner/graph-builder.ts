// Graph builder for route planning

import type { Graph, GraphNode, GraphEdge } from '@types/graph.js';
import type { RouteDetails } from '@types/route.js';
import { ROUTE_TYPE_WEIGHTS, TRANSMILENIO } from '@config/constants.js';
import { logger } from '@lib/logger.js';

/**
 * Build a weighted graph from route data
 */
export function buildGraph(routes: RouteDetails[]): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge[]>();

  logger.info(`Building graph from ${routes.length} routes...`);

  // Create nodes for all stations
  for (const route of routes) {
    for (const stationName of route.stations) {
      const stationId = normalizeStationId(stationName);

      if (!nodes.has(stationId)) {
        nodes.set(stationId, {
          id: stationId,
          name: stationName,
          type: 'station',
        });
      }
    }
  }

  // Create edges for all route segments
  for (const route of routes) {
    for (let i = 0; i < route.stations.length - 1; i++) {
      const from = normalizeStationId(route.stations[i]);
      const to = normalizeStationId(route.stations[i + 1]);

      // Calculate weight (travel time) for this edge
      const weight = calculateEdgeWeight(route, i);

      const edge: GraphEdge = {
        from,
        to,
        route: route.code,
        weight,
        distance: route.distance / route.stations.length, // Approximate
      };

      // Add edge to adjacency list
      if (!edges.has(from)) {
        edges.set(from, []);
      }
      edges.get(from)!.push(edge);

      // Add reverse edge (bidirectional)
      if (!edges.has(to)) {
        edges.set(to, []);
      }
      edges.get(to)!.push({
        ...edge,
        from: to,
        to: from,
      });
    }
  }

  logger.success(`Graph built: ${nodes.size} nodes, ${countEdges(edges)} edges`);

  return { nodes, edges };
}

/**
 * Add transfer edges between stations
 */
export function addTransferEdges(graph: Graph, transferTime = TRANSMILENIO.transferTime): Graph {
  const { nodes, edges } = graph;

  // Find stations that have multiple routes (transfer points)
  const transferPoints = new Map<string, Set<string>>();

  for (const [nodeId, edgeList] of edges.entries()) {
    const routes = new Set(edgeList.map((e) => e.route));
    if (routes.size > 1) {
      transferPoints.set(nodeId, routes);
    }
  }

  logger.info(`Found ${transferPoints.size} transfer points`);

  // For now, transfers are implicit in the route changes
  // No need to add explicit transfer edges since our Dijkstra implementation
  // will handle route changes as transfers

  return graph;
}

/**
 * Normalize station ID (convert name to ID)
 */
function normalizeStationId(stationName: string): string {
  return stationName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Calculate edge weight (travel time in minutes)
 */
function calculateEdgeWeight(route: RouteDetails, segmentIndex: number): number {
  const baseTime = route.estimatedDuration / (route.stations.length - 1);

  // Apply route type multiplier
  const typeMultiplier = ROUTE_TYPE_WEIGHTS[route.type] || 1.0;

  return Math.round(baseTime * typeMultiplier);
}

/**
 * Count total edges in the graph
 */
function countEdges(edges: Map<string, GraphEdge[]>): number {
  let count = 0;
  for (const edgeList of edges.values()) {
    count += edgeList.length;
  }
  return count / 2; // Divide by 2 because edges are bidirectional
}

/**
 * Find node by station name (fuzzy match)
 */
export function findNodeByName(graph: Graph, stationName: string): GraphNode | null {
  const normalizedSearch = normalizeStationId(stationName);

  // Exact match first
  if (graph.nodes.has(normalizedSearch)) {
    return graph.nodes.get(normalizedSearch)!;
  }

  // Fuzzy match
  for (const [nodeId, node] of graph.nodes.entries()) {
    if (
      nodeId.includes(normalizedSearch) ||
      normalizedSearch.includes(nodeId) ||
      node.name.toLowerCase().includes(stationName.toLowerCase())
    ) {
      return node;
    }
  }

  return null;
}
