// Ajusta la ruta a tu archivo de interfaces del perfil.
import { PerfilConductorData } from './get-perfil-conductor.interface';

// *********************************************************
// SOLICITUD
// *********************************************************

export interface ChangeEstadoConductorRequest {
  estado: boolean;
}

// *********************************************************
// RESPUESTA
// *********************************************************

export interface ChangeEstadoConductorResponse {
  success: boolean;
  message: string;
  data: PerfilConductorData;
}
