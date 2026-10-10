import { PwaStatusComponent } from '../../shared/ui/pwa-status/pwa-status.component';
import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../data/auth.service';
@Component({
  selector: 'app-login',
  imports: [PwaStatusComponent],
  template: `<main class="login" [attr.data-project-id]="auth.projectId">
    <div class="panel">
      <img src="/icons/kolegium.svg" alt="" width="56" height="56" />
      <p class="eyebrow">KOLEGIUM</p>
      <app-pwa-status />
      <h1>Tvoj studentski prostor</h1>
      <p>Prijavi se za pristup svojim semestrima i kolegijima.</p>
      @if (auth.status() === 'unconfigured') {
        <p class="notice" role="status">
          Produkcijska konfiguracija još nije postavljena. Za lokalni rad pokreni development
          aplikaciju i emulatore prema README-u.
        </p>
      } @else if (auth.status() === 'loading') {
        <p role="status">Provjeravam prijavu…</p>
      } @else if (auth.status() === 'forbidden') {
        <p class="error" role="alert">Ovaj račun nema dopušten pristup aplikaciji.</p>
        <button (click)="logout()" [disabled]="auth.busy()">Promijeni račun</button>
      } @else {
        <button class="primary" (click)="auth.login()" [disabled]="auth.busy()">
          {{
            auth.busy()
              ? 'Prijava u tijeku…'
              : auth.isLocal
                ? 'Prijava testnim Google računom'
                : 'Prijava Google računom'
          }}
        </button>
      }
      @if (auth.error()) {
        <p class="error" role="alert">{{ auth.error() }}</p>
      }
      @if (auth.isLocal) {
        <p class="local-note">
          Lokalno testno okruženje. Koristi sintetički račun i Firebase emulatore; nema stvarne
          Google prijave ni cloud podataka.
        </p>
      }
    </div>
  </main>`,
  styles: `
    .login {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--space-6);
    }
    .panel {
      max-width: 480px;
      width: 100%;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8);
    }
    .eyebrow {
      margin-top: var(--space-6);
    }
    p {
      color: var(--color-text-muted);
    }
    button {
      margin: var(--space-4) 0;
    }
    .error {
      color: var(--color-error);
    }
    .local-note {
      font-size: 14px;
    }
    .notice {
      background: var(--color-ice);
      padding: var(--space-4);
      border-radius: var(--radius-sm);
    }
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  constructor() {
    effect(() => {
      if (this.auth.status() === 'allowed') {
        const target = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        void this.router.navigateByUrl(
          target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/login')
            ? target
            : '/',
          { replaceUrl: true },
        );
      }
    });
  }
  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
      window.location.assign('/login');
    } catch {
      /* Auth service exposes the actionable message. */
    }
  }
}
