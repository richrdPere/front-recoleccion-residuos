// Importa PersonalPorRolItem desde tu interfaz de personal por rol.

import { PersonalPorRolItem } from "./get-personal_by_rol.interface";


// *********************************************************
// RECOLECTOR DISPONIBLE
// *********************************************************

export type RecolectorDisponibleItem = PersonalPorRolItem;

// *********************************************************
// RESPUESTA
// *********************************************************

export interface GetRecolectoresDisponiblesResponse {
  success: boolean;
  message: string;
  data: RecolectorDisponibleItem[];
}
