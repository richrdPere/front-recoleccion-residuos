import { DomicilioCiudadanoData } from "./create-domicilio.interface";

// *********************************************************
// REQUEST
// *********************************************************
export interface ActualizarDomicilioRequest {
  nombre_domicilio: string;
  direccion: string;
  referencia: string;

  latitud: number;
  longitud: number;
  precision_ubicacion: number;
  origen_ubicacion: string;

  observacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface ActualizarDomicilioResponse {
  success: boolean;
  message: string;
  data: DomicilioActualizadoData;
}

// *********************************************************
// DOMICILIO ACTUALIZADO
// *********************************************************
export interface DomicilioActualizadoData
  extends DomicilioCiudadanoData {
  fecha_validacion: string | null;
  id_usuario_validacion: number | null;
  deleted_at: string | null;
}
