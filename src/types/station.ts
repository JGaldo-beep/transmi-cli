// Station types for Transmilenio CLI

export type StationType =
  | 'troncal'
  | 'portal'
  | 'intermedia'
  | 'sencilla'
  | 'sitp'
  | 'cable';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  coordinates?: Coordinates;
  address?: string;
  routes: string[]; // Array of route IDs that pass through this station
  accessibility?: {
    elevator: boolean;
    ramp: boolean;
    tactilePaving: boolean;
  };
  services?: string[]; // e.g., ['wifi', 'parking', 'bike_parking', 'atm']
}
