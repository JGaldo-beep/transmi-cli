// Geocoding types for address-based trip planning

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  displayName: string;
}

export interface StationWithDistance {
  stationName: string;
  stationAddress: string;
  coordinates: Coordinates;
  distanceMeters: number;
  walkingTimeMinutes: number;
}

export interface AddressBasedTrip {
  origin: {
    address: string;
    coordinates: Coordinates;
    nearestStation: StationWithDistance;
  };
  destination: {
    address: string;
    coordinates: Coordinates;
    nearestStation: StationWithDistance;
  };
  transitRoute: any; // Will be TripPlan from trip.ts
  totalTime: number;
  totalDistance: number;
}
