import type {
  AddRolUsuarioData,
} from './add-rol-usuario.interface';

// *********************************************************
// DATOS DE LA RESPUESTA
// *********************************************************
export type RemoveRolUsuarioData = AddRolUsuarioData;

// *********************************************************
// RESPUESTA
// *********************************************************
export interface RemoveRolUsuarioResponse {
  success: boolean;
  message: string;
  data: RemoveRolUsuarioData;
}
