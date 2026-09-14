import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

// Izitoast
import iziToast from 'izitoast';

// Service
import { AuthService } from '../../services/auth.service';
import { AuthRole, LoginRequest } from '../../models';
import { AuthStorageService } from '../../../../core/auth/auth-storage.service';




@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './login-page.component.html',
  styles: ``,
})
export class LoginPageComponent implements OnInit {

  formLogin!: FormGroup;

  loading = false;
  showPassword = false;
  errorMessage = '';


  private readonly DEVICE_ID_KEY = 'recoleccion_web_device_id';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly authStorage: AuthStorageService,
    private readonly router: Router,
  ) { }


  ngOnInit(): void {
    this.initLoginForm();

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  // =========================================================
  // INICIALIZAR FORMULARIO
  // =========================================================

  private initLoginForm(): void {
    this.formLogin = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  // =========================================================
  // MOSTRAR/OCULTAR CONTRASEÑA
  // =========================================================

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // LOGIN
  // =========================================================
  login(): void {
    if (this.formLogin.invalid || this.loading) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const username = String(this.formLogin.get('username')?.value ?? '').trim();
    const password = String(this.formLogin.get('password')?.value ?? '');

    const request: LoginRequest = {
      username,
      password,
      dispositivo_id: this.authStorage.getOrCreateDeviceId(),
      tipo_dispositivo: 'WEB',
      nombre_dispositivo: this.getDeviceName(),
    };

    this.authService.login(request)
      .pipe(
        /*
         * finalize se ejecuta tanto en éxito como en error.
         * complete no se ejecuta cuando ocurre un error.
         */
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          iziToast.success({
            title: 'Éxito',
            message:
              response.message ||
              'Inicio de sesión exitoso.',
            position: 'bottomRight',
          });

          this.redirectByRole(response.data.usuario.roles);
        },

        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.error?.error ||
            'No se pudo iniciar sesión.';

          iziToast.error({
            title: 'Error',
            message: this.errorMessage,
            position: 'bottomRight',
          });
        },
      });
  }

  // =========================================================
  // NOMBRE DEL DISPOSITIVO
  // =========================================================
  private getDeviceName(): string {
    const browser = this.detectBrowser();
    const operatingSystem = this.detectOperatingSystem();

    return `${browser} en ${operatingSystem}`;
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Edg/')) {
      return 'Microsoft Edge';
    }

    if (userAgent.includes('OPR/')) {
      return 'Opera';
    }

    if (
      userAgent.includes('Chrome/') &&
      !userAgent.includes('Edg/')
    ) {
      return 'Google Chrome';
    }

    if (userAgent.includes('Firefox/')) {
      return 'Mozilla Firefox';
    }

    if (
      userAgent.includes('Safari/') &&
      !userAgent.includes('Chrome/')
    ) {
      return 'Safari';
    }

    return 'Naveavegador web';
  }

  private detectOperatingSystem(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Windows')) {
      return 'Windows';
    }

    if (userAgent.includes('Android')) {
      return 'Android';
    }

    if (
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      return 'iOS';
    }

    if (userAgent.includes('Mac OS')) {
      return 'macOS';
    }

    if (userAgent.includes('Linux')) {
      return 'Linux';
    }

    return 'dispositivo desconocido';
  }

  // =========================================================
  // REDIRECCIÓN SEGÚN ROLES
  // =========================================================

  private redirectByRole(roles: readonly AuthRole[]): void {
    /*
     * Extraer y normalizar los nombres de los roles.
     */
    const roleNames = new Set(
      roles.map((role) => {
        return role.nombre
          .trim()
          .toUpperCase();
      }),
    );

    /*
     * SUPER_ADMIN y ADMIN ingresan al dashboard.
     */
    if (roleNames.has('SUPER_ADMIN') || roleNames.has('ADMIN')) {

      void this.router.navigateByUrl(
        '/admin/dashboard',
      );

      return;
    }

    /*
     * SUPERVISOR ingresa al monitoreo operativo.
     */
    if (roleNames.has('SUPERVISOR')) {
      void this.router.navigateByUrl(
        '/monitoreo',
      );

      return;
    }

    /*
     * OPERADOR ingresa al monitoreo diario.
     */
    if (roleNames.has('OPERADOR')) {
      void this.router.navigateByUrl(
        '/monitoreo',
      );

      return;
    }

    /*
     * CONDUCTOR y RECOLECTOR utilizarán principalmente
     * la aplicación móvil. Si ingresan a la web, se
     * muestra acceso denegado.
     */
    if (roleNames.has('CONDUCTOR') || roleNames.has('RECOLECTOR')) {
      void this.router.navigateByUrl(
        '/acceso-denegado',
      );

      return;
    }

    /*
     * El ciudadano regresa a la plataforma pública.
     */
    if (roleNames.has('CIUDADANO')) {
      void this.router.navigateByUrl(
        '/publico',
      );

      return;
    }

    /*
     * Usuario sin un rol reconocido.
     */
    void this.router.navigateByUrl(
      '/acceso-denegado',
    );
  }
}
