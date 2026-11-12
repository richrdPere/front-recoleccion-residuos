import {
  PublicId,
  PublicRouteInformation,
} from './public-qr.model';

export interface PublicZone {
  id_zona: PublicId;
  codigo: string;
  nombre: string;
  color: string;
}

export interface PublicRouteOption {
  id_ruta: PublicId;
  id_zona: PublicId;
  codigo: string;
  nombre: string;
  color: string;
  estado_ruta: 'ACTIVA' | 'INACTIVA';
}

export interface PublicZonesData {
  items: PublicZone[];
  total: number;
}

export interface PublicZoneRoutesData {
  zona: PublicZone;
  items: PublicRouteOption[];
  total: number;
}

export interface PublicRouteInformationData
  extends PublicRouteInformation {
  tipo_recurso: 'RUTA';
  origen_consulta: 'WEB';

  fecha_consulta: string;
  fecha_actualizacion: string;

  recurso_disponible: boolean;
  cronograma_disponible: boolean;
}
