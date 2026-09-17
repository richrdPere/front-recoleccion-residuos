import { ApiResponse } from "src/app/core/models/api-response.model";
import { CreateProgramacionPersonalAsignado } from "../programaciones";

// *********************************************************
// PERSONAL ASIGNADO A UNA PROGRAMACIÓN
// *********************************************************
export type ProgramacionPersonalAsignadoData = CreateProgramacionPersonalAsignado;

// *********************************************************
// RESPUESTA
// *********************************************************
export type GetPersonalByProgramacionResponse = ApiResponse<ProgramacionPersonalAsignadoData[]>;
