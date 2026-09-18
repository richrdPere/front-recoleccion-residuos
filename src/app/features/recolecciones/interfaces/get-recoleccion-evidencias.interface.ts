import { ApiResponse } from 'src/app/core/models/api-response.model';
import { RecoleccionEvidenciaData } from './anular-evidencia.interface';

// *********************************************************
// DATA
// *********************************************************
export interface RecoleccionEvidenciaItem
  extends RecoleccionEvidenciaData {
  usuario_registro: EvidenciaUsuarioRegistro;
}

export interface EvidenciaUsuarioRegistro {
  id_usuario: number;
  username: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type GetRecoleccionEvidenciasResponse = ApiResponse<RecoleccionEvidenciaItem[]>;
