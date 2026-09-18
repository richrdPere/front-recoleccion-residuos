import { ApiResponse } from "src/app/core/models/api-response.model";

// *********************************************************
// EVIDENCIA
// *********************************************************
export interface RecoleccionEvidenciaData {
  id_evidencia: number;
  id_recoleccion: number;
  id_usuario: number;

  tipo_evidencia: 'IMAGEN' | 'DOCUMENTO';

  nombre_original: string;
  nombre_almacenado: string;
  ruta_archivo: string;
  url_archivo: string | null;

  mime_type: string;
  extension: string | null;
  tamano_bytes: number;
  hash_sha256: string | null;

  fecha_captura: string | null;
  descripcion: string | null;

  estado_evidencia: 'ACTIVA' | 'ANULADA';
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;
  id_usuario_anulacion: number | null;

  created_at: string;
  updated_at: string;
}

// *********************************************************
// REQUEST
// *********************************************************
export interface AnularEvidenciaRequest {
  motivo_anulacion: string;
}

// *********************************************************
// RESPONSE
// *********************************************************
export type AnularEvidenciaResponse = ApiResponse<RecoleccionEvidenciaData>;
