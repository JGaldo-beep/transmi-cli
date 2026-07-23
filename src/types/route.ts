// Route types for Transmilenio CLI

export type RouteType =
  | 'TransMilenio'
  | 'TransMiZonal'
  | 'Alimentador'
  | 'Complementario'
  | 'Especial';

export type RouteStatus = 'active' | 'inactive' | 'maintenance';

// API Response types (snake_case from backend)
export interface ApiHorario {
  id: string;
  tipoDia: string; // "L-V", "L-S", "D-F", etc.
  inicio: string; // "4:30 AM"
  fin: string; // "11:00 PM"
}

export interface ApiTroncal {
  id: number;
  nombre: string;
  zona: string;
  color: string;
  esquemaPdf: string | null;
}

export interface ApiInformacion {
  id: number;
  esquema: string | null;
  tabla: string | null;
  mapa: string | null;
  puntosParada: string | null;
  plegable: string | null;
  fechaActualizacion: string | null;
  usuario: string | null;
}

export interface ApiParadero {
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  posicion: number;
  sistema: string;
  color: string;
}

export interface ApiRoute {
  id: number;
  nombre: string;
  tipo: RouteType;
  color: string;
  esquemaPdf: string | null;
  horarios: ApiHorario[];
  troncal: ApiTroncal | null;
  informacion: ApiInformacion | null;
  codigo: string;
}

export interface ApiRoutesResponse {
  content: ApiRoute[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Internal types (camelCase for our app)
export interface Route {
  id: string;
  code: string;
  name: string;
  type: RouteType;
  color: string;
  status: RouteStatus;
  troncal?: {
    id: number;
    name: string;
    zone: string;
    color: string;
  };
}

export interface Horario {
  dayType: string; // "L-V" (Mon-Fri), "L-S" (Mon-Sat), "D-F" (Sun-Holiday)
  start: string; // "4:30 AM"
  end: string; // "11:00 PM"
}

export interface RouteDetails extends Route {
  horarios: Horario[];
  informacion?: {
    plegable?: string;
    esquema?: string;
    tabla?: string;
    mapa?: string;
  };
  // Calculated/derived fields for planner
  stations?: string[];
  estimatedDuration?: number;
}
