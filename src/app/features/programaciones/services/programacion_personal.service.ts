import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';

// Environment
import { environment } from 'src/environments/environment';

// Service
import { AuthStorageService } from 'src/app/core/auth/auth-storage.service';

// Helper
import { HttpServiceHelper } from 'src/app/core/auth/http-service.helper';

// Interfaces
import { AddPersonalProgramacionRequest, AddPersonalProgramacionResponse, GetPersonalByProgramacionResponse, RemovePersonalProgramacionRequest, RemovePersonalProgramacionResponse } from '../interfaces/programacion-personal';

@Injectable({
  providedIn: 'root'
})
export class ProgramacionPersonalService {

  // *********************************************************
  // ENDPOINTS
  // *********************************************************
  private readonly API_BASE = environment.apiUrl + 'programaciones';

  private readonly API_GET_PERSONAL_BY_PROGRAMACION: string = this.API_BASE + '/';
  private readonly API_ADD_PERSONAL_PROGRAMACION: string = this.API_BASE + '/';
  private readonly API_REMOVE_PERSONAL_PROGRAMACION: string = this.API_BASE + '/';

  constructor(
    private readonly http: HttpClient,
    private readonly authStorage: AuthStorageService
  ) { }

  // *********************************************************
  // 1. OBTENER PERSONAL POR ID DE PROGRAMACIÓN
  // *********************************************************
  getPersonalByProgramacion(
    idProgramacion: number,
  ): Observable<GetPersonalByProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .get<GetPersonalByProgramacionResponse>(
        `${this.API_GET_PERSONAL_BY_PROGRAMACION}${idProgramacion}/personal`,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo obtener el personal de la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 2. AGREGAR PERSONAL A UNA PROGRAMACIÓN
  // *********************************************************
  addPersonalProgramacion(
    idProgramacion: number,
    request: AddPersonalProgramacionRequest,
  ): Observable<AddPersonalProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .post<AddPersonalProgramacionResponse>(
        `${this.API_ADD_PERSONAL_PROGRAMACION}${idProgramacion}/personal`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo agregar el personal a la programación.',
          ),
        ),
      );
  }

  // *********************************************************
  // 3. RETIRAR PERSONAL DE UNA PROGRAMACIÓN
  // *********************************************************
  removePersonalProgramacion(
    idProgramacion: number,
    idProgramacionPersonal: number,
    request: RemovePersonalProgramacionRequest,
  ): Observable<RemovePersonalProgramacionResponse> {
    const headers = this.getJsonHeaders();

    return this.http
      .patch<RemovePersonalProgramacionResponse>(
        `${this.API_REMOVE_PERSONAL_PROGRAMACION}${idProgramacion}/personal/${idProgramacionPersonal}/retirar`,
        request,
        { headers },
      )
      .pipe(
        catchError((error) =>
          HttpServiceHelper.handleError(
            error,
            'No se pudo retirar el personal de la programación.',
          ),
        ),
      );
  }


  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private getJsonHeaders(): HttpHeaders {
    return HttpServiceHelper.getHeaders({
      token:
        this.authStorage.getAccessToken(),
    });
  }
}
