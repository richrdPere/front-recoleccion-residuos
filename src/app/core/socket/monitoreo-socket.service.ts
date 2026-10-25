import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MONITOREO_SOCKET_CONFIG, EstadoConexionSocket, ErrorSocket,
  TrackingActualizadoSocket, RecorridoActualizadoSocket, RespuestaSocket,
} from './monitoreo-socket.types';

@Injectable({ providedIn: 'root' })
export class MonitoreoSocketService {
  private readonly config = inject(MONITOREO_SOCKET_CONFIG, { optional: true });
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private renovando = false;
  private ultimoIntentoRenovacion = 0;
  private readonly cierresSesion = new Subject<void>();
  readonly sesionCerrada$ = this.cierresSesion.asObservable();

  constructor() {
    this.config?.tokensActualizados$?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Si el interceptor HTTP rotó la sesión, reemplazar el socket anterior.
        // No duplicar la reconexión durante la renovación iniciada por el socket.
        if (this.socket && !this.renovando) void this.iniciar();
      });
    this.config?.sesionCerrada$?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.detener();
        this.error.set(null);
        this.requiereAutenticacion.set(false);
        this.cierresSesion.next();
      });
    this.destroyRef.onDestroy(() => this.detener());
  }
  private socket: Socket | null = null;
  private generacion = 0;
  private reintento?: ReturnType<typeof setTimeout>;

  readonly estado = signal<EstadoConexionSocket>('DESCONECTADO');
  readonly error = signal<ErrorSocket | null>(null);
  readonly requiereAutenticacion = signal(false);

  private readonly ubicaciones = new Subject<TrackingActualizadoSocket>();
  private readonly recorridos = new Subject<RecorridoActualizadoSocket>();
  private readonly sincronizaciones = new Subject<void>();
  readonly ubicacion$ = this.ubicaciones.asObservable();
  readonly recorrido$ = this.recorridos.asObservable();
  /** Reconexión o cambio de programación: recuperar el DTO autorizado por REST. */
  readonly sincronizar$ = this.sincronizaciones.asObservable();

  async iniciar(): Promise<void> {
    this.detener();
    const generacion = this.generacion;
    const config = this.config;
    if (!config?.url || !config.obtenerToken) {
      this.fallar({
        code: 'SOCKET_CONFIG_REQUIRED', statusCode: 0,
        message: 'Configure la URL del socket y el acceso al token de su sesión.'
      });
      return;
    }
    this.estado.set('CONECTANDO');
    this.error.set(null);
    this.requiereAutenticacion.set(false);
    try {
      const token = await config.obtenerToken();
      if (generacion !== this.generacion) return;
      if (!token?.trim()) {
        this.fallar({
          code: 'ACCESS_TOKEN_REQUIRED', statusCode: 401,
          message: 'No hay una sesión disponible para conectar el monitoreo.'
        });
        return;
      }
      const socket = io(config.url, {
        path: config.path ?? '/socket.io',
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        auth: (callback) => {
          // También se consulta tras cortes de red, sin almacenar credenciales.
          Promise.resolve().then(() => config.obtenerToken())
            .then((actual) => {
              if (this.socket === socket) callback({ token: actual?.trim().replace(/^Bearer\s+/i, '') ?? '' });
            })
            .catch(() => {
              if (this.socket === socket) callback({ token: '' });
            });
        },
      });
      this.socket = socket;
      const dentro = (fn: () => void) => {
        if (this.socket === socket) this.zone.run(fn);
      };
      socket.on('connect', () => dentro(() => {
        this.error.set(null);
        this.requiereAutenticacion.set(false);
        void this.suscribir(socket);
      }));
      socket.on('disconnect', (reason: string) => dentro(() => {
        clearTimeout(this.reintento);
        this.estado.set(this.error() ? 'ERROR' : 'DESCONECTADO');
        if (reason === 'io server disconnect' && !this.error()) {
          this.fallar({
            code: 'SERVER_DISCONNECTED', statusCode: 0,
            message: 'El servidor cerró la conexión. Verifique la sesión y reconecte.'
          });
        }
      }));
      socket.on('connect_error', (error: Error & { data?: Partial<ErrorSocket> }) =>
        dentro(() => this.procesarErrorAutenticacion({
          code: error.data?.code ?? 'SOCKET_CONNECTION_ERROR',
          statusCode: error.data?.statusCode ?? 0,
          message: error.data?.message ?? error.message,
        })));
      socket.on('auth:error', (error: Partial<ErrorSocket>) => dentro(() =>
        this.procesarErrorAutenticacion({
          code: error.code ?? 'SOCKET_AUTH_ERROR',
          statusCode: error.statusCode ?? 401,
          message: error.message ?? 'La sesión debe validarse nuevamente.'
        })));
      socket.on('sala:revocada', (data: { room: string; code: string }) => dentro(() => {
        if (data.room === 'monitoreo:operativo') {
          this.fallar({
            code: data.code, statusCode: 403,
            message: 'Se retiró el acceso al monitoreo operativo.'
          });
          this.sincronizaciones.next();
        }
      }));
      socket.on('tracking:ubicacion:actualizada', (event: TrackingActualizadoSocket) =>
        dentro(() => { if (this.estado() === 'EN_VIVO') this.ubicaciones.next(event); }));
      socket.on('recorrido:estado:actualizado', (event: RecorridoActualizadoSocket) =>
        dentro(() => this.recorridos.next(event)));
      socket.on('programacion:actualizada', () => dentro(() => this.sincronizaciones.next()));
      this.zone.runOutsideAngular(() => socket.connect());
    } catch {
      if (generacion === this.generacion) this.fallar({
        code: 'TOKEN_READ_ERROR',
        statusCode: 0, message: 'No se pudo consultar el token de la sesión.'
      });
    }
  }

  private async suscribir(socket: Socket): Promise<void> {
    clearTimeout(this.reintento);
    this.estado.set('SUSCRIBIENDO');
    const conexion = socket.id;
    try {
      const result: RespuestaSocket<{ room: string; recorridos: unknown[] }> =
        await socket.timeout(10000).emitWithAck('monitoreo:suscribir', {});
      if (this.socket !== socket || !socket.connected || socket.id !== conexion) return;
      this.zone.run(() => {
        if (!result.success) { this.procesarErrorAutenticacion(result); return; }
        this.estado.set('EN_VIVO');
        this.error.set(null);
        // Este snapshot no tiene el mismo contrato que /monitoreo/mapa.
        this.sincronizaciones.next();
      });
    } catch {
      if (this.socket !== socket || !socket.connected || socket.id !== conexion) return;
      this.zone.run(() => this.fallar({
        code: 'MONITOR_ACK_TIMEOUT', statusCode: 0,
        message: 'Sin confirmación del monitoreo. Se reintentará la suscripción.'
      }));
      this.reintento = setTimeout(() => {
        if (this.socket === socket && socket.connected) void this.suscribir(socket);
      }, 5000);
    }
  }

  detener(): void {
    this.generacion++;
    clearTimeout(this.reintento);
    const socket = this.socket;
    this.socket = null;
    socket?.removeAllListeners();
    socket?.disconnect();
    this.estado.set('DESCONECTADO');
  }

  private procesarErrorAutenticacion(error: ErrorSocket): void {
    this.fallar(error);
    // No intentar recuperar automáticamente una sesión revocada ni permisos 403.
    if (error.code !== 'ACCESS_TOKEN_EXPIRED' || !this.config?.renovarToken || this.renovando) return;
    // Evita un bucle si el servidor rechaza incluso un token recién renovado.
    if (Date.now() - this.ultimoIntentoRenovacion < 10000) return;
    this.ultimoIntentoRenovacion = Date.now();
    void this.renovarYReconectar();
  }

  private async renovarYReconectar(): Promise<void> {
    const generacion = this.generacion;
    this.renovando = true;
    try {
      const token = await this.config!.renovarToken!();
      if (generacion !== this.generacion) return;
      if (!token) {
        this.fallar({
          code: 'ACCESS_TOKEN_REQUIRED', statusCode: 401,
          message: 'La sesión no está disponible. Vuelva a iniciar sesión.'
        });
        return;
      }
      await this.iniciar();
    } catch {
      if (generacion === this.generacion) this.fallar({
        code: 'SOCKET_REFRESH_FAILED',
        statusCode: 401, message: 'No se pudo renovar la sesión del monitoreo.'
      });
    } finally {
      this.renovando = false;
    }
  }

  private fallar(error: ErrorSocket): void {
    this.error.set(error);
    this.estado.set('ERROR');
    this.requiereAutenticacion.set(error.statusCode === 401);
  }
}

// import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
// import { io, Socket } from 'socket.io-client';
// import { Subject } from 'rxjs';

// // Types
// import { MONITOREO_SOCKET_CONFIG, EstadoConexionSocket, ErrorSocket, TrackingActualizadoSocket, RecorridoActualizadoSocket, RespuestaSocket, } from './monitoreo-socket.types';

// @Injectable({
//   providedIn: 'root'
// })
// export class MonitoreoSocketService {

//   private readonly config = inject(MONITOREO_SOCKET_CONFIG, { optional: true });
//   private readonly zone = inject(NgZone);
//   private readonly destroyRef = inject(DestroyRef);

//   private socket: Socket | null = null;
//   private generacion = 0;
//   private reintento?: ReturnType<typeof setTimeout>;

//   readonly estado = signal<EstadoConexionSocket>('DESCONECTADO');
//   readonly error = signal<ErrorSocket | null>(null);
//   readonly requiereAutenticacion = signal(false);

//   private readonly ubicaciones = new Subject<TrackingActualizadoSocket>();
//   private readonly recorridos = new Subject<RecorridoActualizadoSocket>();
//   private readonly sincronizaciones = new Subject<void>();
//   readonly ubicacion$ = this.ubicaciones.asObservable();
//   readonly recorrido$ = this.recorridos.asObservable();
//   /** Reconexión o cambio de programación: recuperar el DTO autorizado por REST. */
//   readonly sincronizar$ = this.sincronizaciones.asObservable();


//   async iniciar(): Promise<void> {
//     this.detener();
//     const generacion = this.generacion;
//     const config = this.config;

//     if (!config?.url || !config.obtenerToken) {
//       this.fallar({
//         code: 'SOCKET_CONFIG_REQUIRED', statusCode: 0,
//         message: 'Configure la URL del socket y el acceso al token de su sesión.'
//       });
//       return;
//     }

//     this.estado.set('CONECTANDO');
//     this.error.set(null);
//     this.requiereAutenticacion.set(false);

//     try {
//       const token = await config.obtenerToken();

//       if (generacion !== this.generacion)
//         return;

//       if (!token?.trim()) {
//         this.fallar({
//           code: 'ACCESS_TOKEN_REQUIRED', statusCode: 401,
//           message: 'No hay una sesión disponible para conectar el monitoreo.'
//         });
//         return;
//       }

//       const socket = io(config.url, {
//         path: config.path ?? '/socket.io',
//         autoConnect: false,
//         reconnection: true,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 10000,
//         timeout: 10000,
//         auth: (callback) => {
//           // También se consulta tras cortes de red, sin almacenar credenciales.
//           Promise.resolve().then(() => config.obtenerToken())
//             .then((actual) => callback({ token: actual?.trim().replace(/^Bearer\s+/i, '') ?? '' }))
//             .catch(() => callback({ token: '' }));
//         },
//       });

//       this.socket = socket;
//       const dentro = (fn: () => void) => {
//         if (this.socket === socket) this.zone.run(fn);
//       };

//       socket.on('connect', () => dentro(() => {
//         this.error.set(null);
//         this.requiereAutenticacion.set(false);
//         void this.suscribir(socket);
//       }));

//       socket.on('disconnect', (reason: string) => dentro(() => {
//         clearTimeout(this.reintento);
//         this.estado.set(this.error() ? 'ERROR' : 'DESCONECTADO');
//         if (reason === 'io server disconnect' && !this.error()) {
//           this.fallar({
//             code: 'SERVER_DISCONNECTED', statusCode: 0,
//             message: 'El servidor cerró la conexión. Verifique la sesión y reconecte.'
//           });
//         }
//       }));

//       socket.on('connect_error', (error: Error & { data?: Partial<ErrorSocket> }) =>
//         dentro(() => this.fallar({
//           code: error.data?.code ?? 'SOCKET_CONNECTION_ERROR',
//           statusCode: error.data?.statusCode ?? 0,
//           message: error.data?.message ?? error.message,
//         })));

//       socket.on('auth:error', (error: Partial<ErrorSocket>) => dentro(() =>
//         this.fallar({
//           code: error.code ?? 'SOCKET_AUTH_ERROR',
//           statusCode: error.statusCode ?? 401,
//           message: error.message ?? 'La sesión debe validarse nuevamente.'
//         })));

//       socket.on('sala:revocada', (data: { room: string; code: string }) => dentro(() => {
//         if (data.room === 'monitoreo:operativo') {
//           this.fallar({
//             code: data.code, statusCode: 403,
//             message: 'Se retiró el acceso al monitoreo operativo.'
//           });
//           this.sincronizaciones.next();
//         }
//       }));

//       socket.on('tracking:ubicacion:actualizada', (event: TrackingActualizadoSocket) =>
//         dentro(() => { if (this.estado() === 'EN_VIVO') this.ubicaciones.next(event); }));

//       socket.on('recorrido:estado:actualizado', (event: RecorridoActualizadoSocket) =>
//         dentro(() => this.recorridos.next(event)));

//       socket.on('programacion:actualizada', () => dentro(() => this.sincronizaciones.next()));
//       this.zone.runOutsideAngular(() => socket.connect());

//     } catch {
//       if (generacion === this.generacion)
//         this.fallar({
//           code: 'TOKEN_READ_ERROR',
//           statusCode: 0, message: 'No se pudo consultar el token de la sesión.'
//         });
//     }
//   }

//   private async suscribir(socket: Socket): Promise<void> {
//     clearTimeout(this.reintento);
//     this.estado.set('SUSCRIBIENDO');
//     const conexion = socket.id;
//     try {
//       const result: RespuestaSocket<{ room: string; recorridos: unknown[] }> =
//         await socket.timeout(10000).emitWithAck('monitoreo:suscribir', {});
//       if (this.socket !== socket || !socket.connected || socket.id !== conexion) return;
//       this.zone.run(() => {
//         if (!result.success) { this.fallar(result); return; }
//         this.estado.set('EN_VIVO');
//         this.error.set(null);
//         // Este snapshot no tiene el mismo contrato que /monitoreo/mapa.
//         this.sincronizaciones.next();
//       });
//     } catch {
//       if (this.socket !== socket || !socket.connected || socket.id !== conexion) return;
//       this.zone.run(() => this.fallar({
//         code: 'MONITOR_ACK_TIMEOUT', statusCode: 0,
//         message: 'Sin confirmación del monitoreo. Se reintentará la suscripción.'
//       }));
//       this.reintento = setTimeout(() => {
//         if (this.socket === socket && socket.connected) void this.suscribir(socket);
//       }, 5000);
//     }
//   }

//   detener(): void {
//     this.generacion++;
//     clearTimeout(this.reintento);
//     const socket = this.socket;
//     this.socket = null;
//     socket?.removeAllListeners();
//     socket?.disconnect();
//     this.estado.set('DESCONECTADO');
//   }

//   private fallar(error: ErrorSocket): void {
//     this.error.set(error);
//     this.estado.set('ERROR');
//     this.requiereAutenticacion.set(error.statusCode === 401);
//   }
// }

