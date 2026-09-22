// *********************************************************
// REQUEST
// *********************************************************
export interface DesactivarDispositivoRequest {
  motivo?: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export interface DesactivarDispositivoResponse {
  success: boolean;
  message: string;
  data: DesactivarDispositivoData;
}

export interface DesactivarDispositivoData {
  id_dispositivo: number;
  estado_dispositivo: 'ACTIVO' | 'INACTIVO' | 'REVOCADO';
  desactivado: boolean;
  ya_estaba_desactivado: boolean;
}
