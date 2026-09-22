// *********************************************************
// REQUEST
// *********************************************************
export interface CrearDomicilioRequest {
  id_zona: number;
  id_ruta: number | null;

  nombre_domicilio: string;
  direccion: string;
  referencia: string;

  latitud: number;
  longitud: number;
  precision_ubicacion: number;
  origen_ubicacion: string;

  es_principal: boolean;
  observacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface CrearDomicilioResponse {
  success: boolean;
  message: string;
  data: DomicilioCiudadanoData;
}

// *********************************************************
// DOMICILIO
// *********************************************************
export interface DomicilioCiudadanoData {
  id_domicilio: number;
  id_ciudadano: number;
  id_zona: number;
  id_ruta: number | null;

  nombre_domicilio: string;
  direccion: string;
  referencia: string | null;

  latitud: number;
  longitud: number;
  precision_ubicacion: number;
  origen_ubicacion: string;

  ubicacion_validada: boolean;
  es_principal: boolean;
  estado_domicilio: string;
  observacion: string | null;

  created_at: string;
  updated_at: string;
}
