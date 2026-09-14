import { ChangeDetectionStrategy, Component, DOCUMENT, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './auth-layout.component.html',
  styles: ``,
})
export class AuthLayoutComponent {
  /*
    |--------------------------------------------------------------------------
    | Dependencias
    |--------------------------------------------------------------------------
    */

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /*
  |--------------------------------------------------------------------------
  | Estado del tema
  |--------------------------------------------------------------------------
  */

  readonly isDarkMode = signal(false);

  /*
  |--------------------------------------------------------------------------
  | Año actual
  |--------------------------------------------------------------------------
  */

  readonly currentYear =
    new Date().getFullYear();

  constructor() {
    this.loadTheme();
  }

  /*
  |--------------------------------------------------------------------------
  | Cambiar tema
  |--------------------------------------------------------------------------
  */

  toggleTheme(): void {
    const darkMode =
      !this.isDarkMode();

    this.isDarkMode.set(darkMode);

    this.applyTheme(
      darkMode ? 'dark' : 'light',
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cargar tema guardado
  |--------------------------------------------------------------------------
  */

  private loadTheme(): void {
    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
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

  /*
  |--------------------------------------------------------------------------
  | Aplicar tema
  |--------------------------------------------------------------------------
  */

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
      .setAttribute('data-theme', theme);

    localStorage.setItem('recoleccion_theme', theme);
  }
}
