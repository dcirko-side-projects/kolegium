import { PwaStatusComponent } from '../../shared/ui/pwa-status/pwa-status.component';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../data/auth.service';
import { AcademicStoreService } from '../academic/academic-store.service';
import { UnsavedChangesService } from '../forms/unsaved-changes.service';
import { DataStatusComponent } from '../../shared/ui/data-status/data-status.component';
import { navigationItems, mobileNavigationItems } from '../navigation/navigation';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-shell',
  imports: [
    PwaStatusComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IconComponent,
    DataStatusComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(AcademicStoreService);
  private readonly changes = inject(UnsavedChangesService);
  protected readonly router = inject(Router);
  protected async logout(): Promise<void> {
    if (!this.changes.confirm()) return;
    try {
      await this.auth.logout();
      window.location.assign('/login');
    } catch {
      /* Auth service holds the error state. */
    }
  }
  protected reload(): void {
    this.changes.reload();
  }
  protected readonly navigation = navigationItems;
  protected readonly mobileNavigation = mobileNavigationItems;
}
