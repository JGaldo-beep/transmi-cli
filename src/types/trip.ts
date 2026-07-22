// Trip and journey planning types for Transmilenio CLI

export interface TripSegment {
  from: string; // Station ID or name
  to: string; // Station ID or name
  route: string; // Route ID or name
  duration: number; // In minutes
  distance: number; // In kilometers
  stops: number; // Number of stops
}

export interface TripPlan {
  origin: string; // Starting station
  destination: string; // Ending station
  segments: TripSegment[]; // Individual trip segments
  transfers: number; // Number of transfers required
  totalDuration: number; // Total duration in minutes
  totalDistance: number; // Total distance in kilometers
  estimatedCost: number; // Estimated cost in COP
  accessibility: boolean; // Whether the route is accessible
  departureTime?: string; // Optional departure time
  arrivalTime?: string; // Optional arrival time
}

export interface Balance {
  cardNumber: string;
  balance: number; // In COP
  status: 'active' | 'blocked' | 'expired';
  lastUpdate: string; // ISO 8601 date string
  transactions?: Transaction[];
}

export interface Transaction {
  date: string; // ISO 8601 date string
  location: string; // Station or location name
  type: 'debit' | 'credit';
  amount: number; // In COP
  balance: number; // Remaining balance after transaction
}
