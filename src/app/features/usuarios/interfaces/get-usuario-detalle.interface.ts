import type {
  UsuarioPaginadoItem,
} from './get-usuarios-paginados.interface';

// *********************************************************
// DETALLE DEL USUARIO
// *********************************************************
export type UsuarioDetalle = UsuarioPaginadoItem;

// *********************************************************
// RESPUESTA
// *********************************************************
export interface GetUsuarioByIdResponse {
  success: boolean;
  message: string;
  data: UsuarioDetalle;
}
