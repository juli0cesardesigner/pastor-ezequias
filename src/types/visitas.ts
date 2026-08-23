export type VisitStatus = 'visitado' | 'pendente';

export interface Visita {
  id: number;
  city: string;
  contactName: string;
  status: VisitStatus;
  phone?: string;
  role?: string;
  address?: string;
  notes?: string;
  visitDate?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt?: string;
}

export interface VisitaInput {
  city: string;
  contactName: string;
  status: VisitStatus;
  phone?: string;
  role?: string;
  address?: string;
  notes?: string;
  visitDate?: string;
  latitude: number;
  longitude: number;
}

export interface ESMunicipality {
  name: string;
  lat: number;
  lng: number;
  region?: string;
}

export interface VisitasStats {
  total: number;
  visitados: number;
  pendentes: number;
  percentVisitados: number;
  uniqueCitiesVisited: number;
  totalCitiesES: number;
}

export type VisitasFilter = 'todos' | 'pendente' | 'visitado';
