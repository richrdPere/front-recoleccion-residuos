import type {
  UsuarioIdentificador,
  UsuarioRolNombre,
} from './get-usuarios-paginados.interface';

// *********************************************************
// REQUEST
// *********************************************************
export interface AddRolUsuarioRequest {
  id_rol: UsuarioIdentificador;
}

// *********************************************************
// ROL
// *********************************************************
export interface AddRolUsuarioRol {
  id_rol: UsuarioIdentificador;
  nombre: UsuarioRolNombre;
  descripcion: string | null;
  estado: boolean;
}

// *********************************************************
// DATOS DE LA RESPUESTA
// *********************************************************
export interface AddRolUsuarioData {
  id_usuario_rol: UsuarioIdentificador;
  id_usuario: UsuarioIdentificador;
  id_rol: UsuarioIdentificador;

  // Estado de la asignación.
  estado: boolean;

  created_at: string;
  changed: boolean;
  rol: AddRolUsuarioRol;
}

// *********************************************************
// RESPUESTA
// *********************************************************
export interface AddRolUsuarioResponse {
  success: boolean;
  message: string;
  data: AddRolUsuarioData;
}
