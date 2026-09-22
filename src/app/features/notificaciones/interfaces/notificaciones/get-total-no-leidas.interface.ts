import { ApiResponse } from "src/app/core/models/api-response.model";

// export interface GetTotalNoLeidasResponse {
//   success: boolean;
//   message: string;
//   data: TotalNoLeidasData;
// }



export type GetTotalNoLeidasResponse = ApiResponse<TotalNoLeidasData>;


export interface TotalNoLeidasData {
  total_no_leidas: number;
}
