// Route types for Transmilenio CLI

export type RouteType = 'troncal' | 'alimentador' | 'complementario' | 'especial' | 'transmi_zonal';

export type RouteStatus = 'active' | 'inactive' | 'maintenance';

export interface Route {
  id: string;
  code: string;
  name: string;
  type: RouteType;
  description?: string;
  status: RouteStatus;
  accessibility?: {
    wheelchair: boolean;
    visualImpairment: boolean;
    audioAnnouncements: boolean;
  };
}

export interface Schedule {
  weekday: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    frequency: {
      peak: number; // Minutes
      offPeak: number; // Minutes
    };
  };
  weekend: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    frequency: number; // Minutes
  };
}

export interface RouteDetails extends Route {
  stations: string[]; // Array of station IDs
  schedule: Schedule;
  distance: number; // In kilometers
  estimatedDuration: number; // In minutes
}
