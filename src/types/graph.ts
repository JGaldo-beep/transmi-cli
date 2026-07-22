// Graph types for route planning algorithms

export interface GraphNode {
  id: string;
  name: string;
  type: 'station' | 'stop';
  coordinates?: [number, number]; // [lat, lon]
}

export interface GraphEdge {
  from: string; // Node ID
  to: string; // Node ID
  route: string; // Route ID
  weight: number; // Travel time in minutes
  distance: number; // In kilometers
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge[]>; // Adjacency list: nodeId -> edges
}

export interface PathResult {
  path: GraphNode[]; // Ordered list of nodes in the path
  totalTime: number; // Total travel time in minutes
  totalDistance: number; // Total distance in kilometers
  transfers: number; // Number of transfers
  routes: string[]; // List of routes used
}
