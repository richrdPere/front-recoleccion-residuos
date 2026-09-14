import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

// Interface
interface PublicNavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './public-layout.component.html',
  styles: ``,
})
export class PublicLayoutComponent {

  // Dependencias
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  // Estado
  readonly mobileMenuOpen = signal(false);
  readonly isDarkMode = signal(false);
  readonly currentYear = new Date().getFullYear();

  // Navegación pública
  readonly navigationItems:
    PublicNavItem[] = [
      {
        label: 'Inicio',
        route: '/publico',
        icon: 'fa-solid fa-house',
        exact: true,
      },

      {
        label: 'Cronogramas',
        route: '/publico/cronogramas',
        icon: 'fa-regular fa-calendar',
      },

      {
        label: 'Consultar sector',
        route: '/publico/consulta',
        icon: 'fa-solid fa-location-dot',
      },

      {
        label: 'Estado de rutas',
        route: '/publico/rutas',
        icon: 'fa-solid fa-route',
      },

      {
        label: 'Reportar problema',
        route: '/publico/reportar',
        icon: 'fa-solid fa-bullhorn',
      },
    ];

  constructor() {
    this.loadTheme();
  }

  // Menú móvil
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((currentValue) => !currentValue);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // Tema
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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)',).matches;

    const darkMode = savedTheme
      ? savedTheme === 'dark'
      : prefersDark;

    this.isDarkMode.set(darkMode);

    this.applyTheme(darkMode ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.documentElement.setAttribute('data-theme', theme);

    localStorage.setItem('recoleccion_theme', theme);
  }
}
