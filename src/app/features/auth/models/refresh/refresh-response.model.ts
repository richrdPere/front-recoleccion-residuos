import { ApiResponse } from "src/app/core/models/api-response.model";

export interface RefreshTokenData {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
  refresh_expires_in: string;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenData>;
