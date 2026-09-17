import { ApiResponse } from 'src/app/core/models/api-response.model';
import { RecorridoData } from './cancelar-recorrido.interface';

export type GetRecorridoActivoResponse = ApiResponse<RecorridoData | null>;
