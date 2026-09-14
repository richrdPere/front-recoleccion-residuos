import { ApiResponse } from "src/app/core/models/api-response.model";

// Roles
export interface AuthRole {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
}

// Persona
export interface AuthPerson {
  id_persona: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string | null;
  celular: string | null;
  direccion: string | null;
  foto_url: string | null;
  genero: string | null;
  estado: boolean;
}

// Usuario
export interface AuthUser {
  id_usuario: number;
  id_persona: number;
  username: string;
  estado: boolean;
  ultimo_acceso: string | null;
  persona: AuthPerson;
  roles: AuthRole[];
}

// Auth jwt
export interface AuthJwtPayload {
  id_usuario: number;
  id_persona?: number;
  username?: string;
  roles: string[];
  session_id: string;
  token_type: 'access' | 'refresh';
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
  jti?: string;
}

// DATA
export interface LoginData {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
  refresh_expires_in: string;
  usuario: AuthUser;
}

// RESPONSE
export type LoginResponse = ApiResponse<LoginData>;
