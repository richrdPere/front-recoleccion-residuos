import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import {
  PublicPageHeaderComponent,
} from '../../components/public-page-header/public-page-header.component';

@Component({
  selector: 'app-privacidad-page',
  standalone: true,
  imports: [
    RouterLink,
    PublicPageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacidad-page.component.html',
})
export class PrivacidadPageComponent { }
