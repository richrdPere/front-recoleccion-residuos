import { TipoRecursoQr } from "../codigos-qr/create-codigo-qr.interface";

// *********************************************************
// RESPONSE
// *********************************************************
export interface ResolverQrPublicoResponse {
  success: boolean;
  message: string;
  data: ResolverQrPublicoData;
}

// *********************************************************
// RESULTADO
// *********************************************************
export interface ResolverQrPublicoData {
  encontrado: boolean;
  disponible: boolean;

  // Pendiente de confirmar todos los estados de resolución.
  estado: string;

  codigo: QrPublicoCodigo;
  recurso: QrPublicoRecurso;
}

// *********************************************************
// INFORMACIÓN PÚBLICA DEL QR
// *********************************************************
export interface QrPublicoCodigo {
  titulo: string;
  descripcion: string | null;
  tipo_recurso: TipoRecursoQr;
}

// *********************************************************
// RECURSO ASOCIADO
// *********************************************************
export interface QrPublicoRecurso {
  tipo: TipoRecursoQr;
  id: number;
  nombre: string;
}
