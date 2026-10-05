import { ApiResponse } from "src/app/core/models/api-response.model";
import { PersonalOperativoData } from "./data/personal-operativo-data.model";

// ============================================================
// RESPONSE
// ============================================================
export type GetPersonalByIdResponse = ApiResponse<PersonalOperativoData>;
