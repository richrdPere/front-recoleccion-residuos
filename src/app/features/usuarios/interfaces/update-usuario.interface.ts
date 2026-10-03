import { ApiResponse } from
  'src/app/core/models/api-response.model';

import type {
  CreateUsuarioData,
  CreateUsuarioPersonaRequest,
} from './create-usuario.interface';

// ============================================================
// REQUEST: PERSONA
// ============================================================

export type UpdateUsuarioPersonaRequest =
  Partial<CreateUsuarioPersonaRequest>;

// ============================================================
// REQUEST: USUARIO
// ============================================================

export interface UpdateUsuarioRequest {
  username?: string;
  email_acceso?: string;

  persona?: UpdateUsuarioPersonaRequest;
}

// ============================================================
// RESPONSE
// ============================================================

export type UpdateUsuarioResponse =
  ApiResponse<CreateUsuarioData>;
