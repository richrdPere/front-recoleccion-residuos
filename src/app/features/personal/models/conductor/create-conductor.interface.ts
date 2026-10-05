// *********************************************************
// TIPOS
// *********************************************************

export type ConductorIdentificador = number | string;

// *********************************************************
// SOLICITUD
// *********************************************************
export interface CreateConductorRequest {
  numero_licencia: string;
  categoria_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  estado_licencia: string;
  restricciones?: string;
  observacion?: string;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface CreateConductorResponse {
  success: boolean;
  message: string;
  data: CreateConductorData;
}

// *********************************************************
// DATOS DEL CONDUCTOR
// *********************************************************

export interface CreateConductorData {
  id_conductor: ConductorIdentificador;
  id_personal: ConductorIdentificador;

  numero_licencia: string;
  categoria_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  estado_licencia: string;

  restricciones: string | null;
  observacion: string | null;
  estado: boolean;

  created_at: string;
  updated_at: string;
}
