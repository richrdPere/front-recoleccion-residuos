import { ChangeDetectionStrategy, Component, DOCUMENT, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

// Services
import { AuthService } from '../../features/auth/services/auth.service';

// Models
import { AuthRole, AuthUser } from '../../features/auth/models';

// =========================================================
// INTERFACES
// =========================================================

interface AdminNavItem {
  label: string;
  description?: string;
  route: string;
  icon: string;
  exact?: boolean;
  disabled?: boolean;
  roles?: readonly string[];
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './admin-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AdminLayoutComponent {

  // DEPENDENCIAS
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  // ESTADO DEL LAYOUT
  readonly sidebarOpen = signal(false);
  readonly isDarkMode = signal(false);
  readonly logoutLoading = signal(false);

  // =========================================================
  // USUARIO AUTENTICADO
  // =========================================================

  /**
   * currentUser$ se encuentra respaldado por un
   * BehaviorSubject, por lo que siempre contiene el último
   * usuario autenticado/restaurado.
   */
  readonly currentUser = signal<AuthUser | null>(this.authService.getCurrentUser());

  /**
   * Nombre completo de la persona.
   */
  readonly userName = computed(() => {
    const usuario = this.currentUser();

    if (!usuario) {
      return 'Usuario';
    }

    const nombres = usuario.persona?.nombres?.trim() ?? '';
    const apellidos = usuario.persona?.apellidos?.trim() ?? '';
    const fullName = `${nombres} ${apellidos}`.trim();

    return fullName || usuario.username;
  });

  /**
   * Roles del usuario autenticado.
   */
  readonly userRoles = computed(() => {
    return (
      this.currentUser()?.roles ?? []
    )
      .map((role) =>
        this.normalizeRole(role.nombre),
      );
  });

  /**
   * Texto que se mostrará debajo del nombre.
   */
  readonly userRole = computed(() => {
    const roles = this.currentUser()?.roles ?? [];

    if (roles.length === 0) {
      return 'SIN ROL';
    }

    return roles
      .map((role) =>
        this.formatRoleName(role),
      )
      .join(' · ');
  });

  /**
   * Iniciales para el avatar cuando el usuario
   * no tiene fotografía.
   */
  readonly userInitials = computed(() => {
    const usuario =
      this.currentUser();

    if (!usuario) {
      return 'US';
    }

    const nombre =
      usuario.persona?.nombres
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)[0] ?? '';

    const apellido =
      usuario.persona?.apellidos
        ?.trim()
        .split(/\s+/)
        .filter(Boolean)[0] ?? '';

    const initials =
      `${nombre.charAt(0)}${apellido.charAt(0)}`
        .toUpperCase();

    if (initials) {
      return initials;
    }

    return usuario.username
      .slice(0, 2)
      .toUpperCase();
  });

  /**
   * Fotografía del usuario.
   */
  readonly userPhotoUrl = computed(() => {
    return (
      this.currentUser()?.persona?.foto_url ??
      null
    );
  });

  // =========================================================
  // NAVEGACIÓN
  // =========================================================
  private readonly allNavigationGroups:
    readonly AdminNavGroup[] = [
      {
        title: 'General',

        items: [
          {
            label: 'Dashboard',
            description: 'Resumen general del sistema',
            route: '/admin/dashboard',
            icon: 'fa-solid fa-chart-line',
            exact: true,
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
            ],
          },

          {
            label: 'Monitoreo',
            description: 'Seguimiento de unidades',
            route: '/admin/monitoreo',
            icon: 'fa-solid fa-map-location-dot',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
        ],
      },
      {
        title: 'Planificación',
        items: [
          {
            label: 'Programaciones',
            description: 'Rutas y horarios programados',
            route: '/admin/programaciones',
            icon: 'fa-regular fa-calendar-check',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
          {
            label: 'Rutas',
            description: 'Rutas y puntos de recolección',
            route: '/admin/rutas',
            icon: 'fa-solid fa-route',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },

          {
            label: 'Zonas y sectores',
            description: 'Cobertura territorial',
            route: '/admin/zonas',
            icon: 'fa-solid fa-map',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },
        ],
      },
      {
        title: 'Operación',

        items: [
          {
            label: 'Recorridos',
            description: 'Jornadas ejecutadas',
            route: '/admin/recorridos',
            icon: 'fa-solid fa-location-arrow',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
          {
            label: 'Recolecciones',
            description: 'Puntos atendidos y cantidades',
            route: '/admin/recolecciones',
            icon: 'fa-solid fa-trash-can-arrow-up',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },

          {
            label: 'Incidencias',
            description: 'Problemas operativos',
            route: '/admin/incidencias',
            icon: 'fa-solid fa-triangle-exclamation',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
        ],
      },
      {
        title: 'Recursos',
        items: [
          {
            label: 'Vehículos',
            description: 'Unidades recolectoras',
            route: '/admin/vehiculos',
            icon: 'fa-solid fa-truck',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },
          {
            label: 'Mantenimientos',
            description: 'Control preventivo y correctivo',
            route: '/admin/mantenimientos',
            icon: 'fa-solid fa-screwdriver-wrench',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },
          {
            label: 'Personal',
            description: 'Conductores y recolectores',
            route: '/admin/personal',
            icon: 'fa-solid fa-users',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },
        ],
      },
      {
        title: 'Ciudadanía',
        items: [
          {
            label: 'Ciudadanos',
            description: 'Usuarios y domicilios',
            route: '/admin/ciudadanos',
            icon: 'fa-solid fa-people-group',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
            ],
          },
          {
            label: 'Reportes ciudadanos',
            description: 'Problemas informados',
            route: '/admin/reportes-ciudadanos',
            icon: 'fa-solid fa-bullhorn',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
          {
            label: 'Códigos QR',
            description: 'Accesos públicos por sector',
            route: '/admin/codigos-qr',
            icon: 'fa-solid fa-qrcode',
            roles: [
              'SUPER_ADMIN',
              'ADMIN',
            ],
          },

          {
            label: 'Notificaciones',

            description:
              'Avisos operativos y ciudadanos',

            route:
              '/admin/notificaciones',

            icon:
              'fa-regular fa-bell',

            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
              'OPERADOR',
            ],
          },
        ],
      },

      {
        title: 'Análisis',

        items: [
          {
            label: 'Reportes',

            description:
              'Consultas y exportaciones',

            route:
              '/admin/reportes',

            icon:
              'fa-regular fa-file-lines',

            roles: [
              'SUPER_ADMIN',
              'ADMIN',
              'SUPERVISOR',
            ],
          },

          {
            label: 'Auditoría',

            description:
              'Historial de operaciones',

            route:
              '/admin/auditoria',

            icon:
              'fa-solid fa-clock-rotate-left',

            roles: [
              'SUPER_ADMIN',
              'ADMIN',
            ],
          },
        ],
      },

      {
        title: 'Administración',

        items: [
          {
            label: 'Usuarios',

            description:
              'Cuentas del sistema',

            route:
              '/admin/usuarios',

            icon:
              'fa-solid fa-user-gear',

            roles: [
              'SUPER_ADMIN',
              'ADMIN',
            ],
          },

          {
            label: 'Roles y permisos',

            description:
              'Control de acceso',

            route:
              '/admin/roles',

            icon:
              'fa-solid fa-shield-halved',

            roles: [
              'SUPER_ADMIN',
            ],
          },
        ],
      },
    ];

  /**
   * Opciones visibles según los roles del usuario.
   *
   * El SUPER_ADMIN puede visualizar todas las opciones.
   */
  readonly navigationGroups = computed<AdminNavGroup[]>(() => {
    const currentRoles = new Set(this.userRoles());
    const isSuperAdmin = currentRoles.has('SUPER_ADMIN');

    return this.allNavigationGroups.map((group) => {
      const items = group.items.filter(
        (item) => {
          if (isSuperAdmin) {
            return true;
          }

          if (
            !item.roles ||
            item.roles.length === 0
          ) {
            return true;
          }

          return item.roles.some(
            (allowedRole) =>
              currentRoles.has(
                this.normalizeRole(
                  allowedRole,
                ),
              ),
          );
        },
      );

      return {
        ...group,
        items,
      };
    })
      .filter(
        (group) =>
          group.items.length > 0,
      );
  });

  constructor() {
    this.loadTheme();

    /*
     * Mantener sincronizados los datos del layout
     * cuando AuthService actualice el usuario.
     */
    this.authService.currentUser$
      .subscribe((usuario) => {
        this.currentUser.set(usuario);
      });
  }

  // =========================================================
  // SIDEBAR
  // =========================================================

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(
      (currentValue) =>
        !currentValue,
    );
  }

  onDrawerChange(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.sidebarOpen.set(
      input.checked,
    );
  }

  // =========================================================
  // TEMA
  // =========================================================

  toggleTheme(): void {
    const darkMode = !this.isDarkMode();
    this.isDarkMode.set(darkMode);

    this.applyTheme(darkMode ? 'dark' : 'light');
  }

  private loadTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = localStorage.getItem('recoleccion_theme');

    const prefersDark =
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

    const darkMode = savedTheme
      ? savedTheme === 'dark'
      : prefersDark;

    this.isDarkMode.set(
      darkMode,
    );

    this.applyTheme(
      darkMode ? 'dark' : 'light',
    );
  }

  private applyTheme(
    theme: 'light' | 'dark',
  ): void {
    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      return;
    }

    this.document
      .documentElement
      .setAttribute(
        'data-theme',
        theme,
      );

    localStorage.setItem(
      'recoleccion_theme',
      theme,
    );
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  navigateToProfile(): void {
    this.closeSidebar();

    void this.router.navigateByUrl(
      '/admin/perfil',
    );
  }

  navigateToSettings(): void {
    this.closeSidebar();

    void this.router.navigateByUrl(
      '/admin/configuracion',
    );
  }

  // =========================================================
  // CERRAR SESIÓN
  // =========================================================

  logout(): void {
    if (this.logoutLoading()) {
      return;
    }

    this.closeSidebar();
    this.logoutLoading.set(true);

    /*
     * logout() devuelve un Observable.
     * Es necesario suscribirse para ejecutar la petición HTTP.
     *
     * AuthService debe limpiar la sesión local mediante
     * finalize(), tanto en éxito como en error.
     */
    this.authService.logout()
      .pipe(
        finalize(() => {
          this.logoutLoading.set(false);

          void this.router.navigateByUrl(
            '/auth/login',
          );
        }),
      )
      .subscribe({
        error: (error) => {
          /*
           * La sesión local ya se elimina mediante
           * finalize() dentro de AuthService.
           */
          console.error(
            'No se pudo cerrar la sesión en el servidor:',
            error,
          );
        },
      });
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  private normalizeRole(
    role: string,
  ): string {
    return role
      .trim()
      .toUpperCase();
  }

  private formatRoleName(
    role: AuthRole,
  ): string {
    return role.nombre
      .trim()
      .replace(/_/g, ' ')
      .toUpperCase();
  }
}
