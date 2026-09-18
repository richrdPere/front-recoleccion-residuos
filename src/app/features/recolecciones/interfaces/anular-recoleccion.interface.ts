import {
  PuntoRecorridoRecoleccion,
} from './get-puntos-recorrido.interface';

// *********************************************************
// REQUEST
// *********************************************************
export interface AnularRecoleccionRequest {
  motivo_anulacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface AnularRecoleccionResponse {
  success: boolean;
  message: string;
  data: PuntoRecorridoRecoleccion;
}
