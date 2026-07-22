// Dijkstra's algorithm for shortest path finding

import type { Graph, GraphNode, PathResult } from '@types/graph.js';
import type { TripPlan, TripSegment } from '@types/trip.js';
import { TRANSMILENIO } from '@config/constants.js';
import { NotFoundError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';

interface DijkstraNode {
  node: GraphNode;
  distance: number;
  previous: GraphNode | null;
  previousRoute: string | null;
}

/**
 * Find shortest path between two stations using Dijkstra's algorithm
 */
export function findShortestPath(
  graph: Graph,
  startNode: GraphNode,
  endNode: GraphNode
): PathResult {
  logger.debug(`Finding path from ${startNode.name} to ${endNode.name}`);

  // Initialize distances
  const distances = new Map<string, DijkstraNode>();
  const visited = new Set<string>();
  const unvisited = new Set<string>();

  for (const [nodeId, node] of graph.nodes.entries()) {
    distances.set(nodeId, {
      node,
      distance: nodeId === startNode.id ? 0 : Infinity,
      previous: null,
      previousRoute: null,
    });
    unvisited.add(nodeId);
  }

  // Dijkstra's algorithm
  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentId: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      const dist = distances.get(nodeId)!.distance;
      if (dist < minDistance) {
        minDistance = dist;
        currentId = nodeId;
      }
    }

    // If no reachable nodes left, break
    if (currentId === null || minDistance === Infinity) {
      break;
    }

    // Mark as visited
    unvisited.delete(currentId);
    visited.add(currentId);

    // If we reached the destination, we can stop
    if (currentId === endNode.id) {
      break;
    }

    // Update distances to neighbors
    const edges = graph.edges.get(currentId) || [];
    const currentDist = distances.get(currentId)!;

    for (const edge of edges) {
      if (visited.has(edge.to)) continue;

      const neighborDist = distances.get(edge.to)!;
      let newDistance = currentDist.distance + edge.weight;

      // Add transfer penalty if changing routes
      if (currentDist.previousRoute && currentDist.previousRoute !== edge.route) {
        newDistance += TRANSMILENIO.transferTime;
      }

      if (newDistance < neighborDist.distance) {
        neighborDist.distance = newDistance;
        neighborDist.previous = currentDist.node;
        neighborDist.previousRoute = edge.route;
      }
    }
  }

  // Reconstruct path
  const path = reconstructPath(distances, startNode, endNode);

  if (path.length === 0) {
    throw new NotFoundError(
      'NO_PATH_FOUND',
      `No path found from ${startNode.name} to ${endNode.name}`
    );
  }

  // Calculate path metrics
  const result = calculatePathMetrics(graph, path, distances);

  logger.success(
    `Found path: ${result.totalTime} min, ${result.transfers} transfers, ${result.routes.length} routes`
  );

  return result;
}

/**
 * Reconstruct path from Dijkstra results
 */
function reconstructPath(
  distances: Map<string, DijkstraNode>,
  startNode: GraphNode,
  endNode: GraphNode
): GraphNode[] {
  const path: GraphNode[] = [];
  let current = distances.get(endNode.id);

  if (!current || current.distance === Infinity) {
    return [];
  }

  while (current) {
    path.unshift(current.node);
    if (current.node.id === startNode.id) {
      break;
    }
    current = current.previous ? distances.get(current.previous.id) : null;
  }

  return path;
}

/**
 * Calculate path metrics (time, distance, transfers, routes)
 */
function calculatePathMetrics(
  graph: Graph,
  path: GraphNode[],
  distances: Map<string, DijkstraNode>
): PathResult {
  const routes: string[] = [];
  let totalDistance = 0;
  let transfers = 0;
  let currentRoute: string | null = null;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    // Find edge between these nodes
    const edges = graph.edges.get(from.id) || [];
    const edge = edges.find((e) => e.to === to.id);

    if (edge) {
      totalDistance += edge.distance;

      // Track route changes (transfers)
      if (currentRoute && currentRoute !== edge.route) {
        transfers++;
      }

      if (currentRoute !== edge.route) {
        routes.push(edge.route);
        currentRoute = edge.route;
      }
    }
  }

  const endNode = path[path.length - 1];
  const totalTime = Math.round(distances.get(endNode.id)!.distance);

  return {
    path,
    totalTime,
    totalDistance: Math.round(totalDistance * 10) / 10,
    transfers,
    routes,
  };
}

/**
 * Convert PathResult to TripPlan
 */
export function pathResultToTripPlan(
  pathResult: PathResult,
  graph: Graph,
  originName: string,
  destinationName: string
): TripPlan {
  const segments: TripSegment[] = [];
  let currentRoute: string | null = null;
  let segmentStart = 0;

  // Build segments
  for (let i = 0; i < pathResult.path.length - 1; i++) {
    const from = pathResult.path[i];
    const to = pathResult.path[i + 1];

    const edges = graph.edges.get(from.id) || [];
    const edge = edges.find((e) => e.to === to.id);

    if (!edge) continue;

    // If route changed or last node, create segment
    if (currentRoute && currentRoute !== edge.route) {
      // Create segment for previous route
      const segmentEnd = i;
      const segment = createSegment(pathResult.path, graph, segmentStart, segmentEnd, currentRoute);
      segments.push(segment);
      segmentStart = i;
    }

    currentRoute = edge.route;
  }

  // Add final segment
  if (currentRoute) {
    const segment = createSegment(
      pathResult.path,
      graph,
      segmentStart,
      pathResult.path.length - 1,
      currentRoute
    );
    segments.push(segment);
  }

  return {
    origin: originName,
    destination: destinationName,
    segments,
    transfers: pathResult.transfers,
    totalDuration: pathResult.totalTime,
    totalDistance: pathResult.totalDistance,
    estimatedCost: TRANSMILENIO.baseFare,
    accessibility: true, // TODO: Check based on route accessibility
  };
}

/**
 * Create a trip segment
 */
function createSegment(
  path: GraphNode[],
  graph: Graph,
  startIdx: number,
  endIdx: number,
  route: string
): TripSegment {
  const from = path[startIdx].name;
  const to = path[endIdx].name;
  const stops = endIdx - startIdx;

  // Calculate duration for this segment
  let duration = 0;
  let distance = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const fromNode = path[i];
    const toNode = path[i + 1];
    const edges = graph.edges.get(fromNode.id) || [];
    const edge = edges.find((e) => e.to === toNode.id && e.route === route);

    if (edge) {
      duration += edge.weight;
      distance += edge.distance;
    }
  }

  return {
    from,
    to,
    route,
    duration: Math.round(duration),
    distance: Math.round(distance * 10) / 10,
    stops,
  };
}
