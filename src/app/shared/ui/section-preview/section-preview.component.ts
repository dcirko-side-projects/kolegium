import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-section-preview',
  imports: [RouterLink, IconComponent],
  template: `<h1>{{ heading }}</h1>
    <p class="description">{{ description }}</p>
    <section>
      <div class="icon"><app-icon [name]="icon" /></div>
      <h2>Ovdje počinje tvoj pregled</h2>
      <p>Sekcija je dostupna u navigaciji. Unos i spremanje podataka dolaze u sljedećim fazama.</p>
      <a routerLink="/sections">Pogledaj sve sekcije</a>
    </section>`,
  styles: `
    .description {
      color: var(--color-text-muted);
      margin-bottom: 32px;
    }
    section {
      text-align: center;
      padding: 64px 24px;
      border: 1px solid var(--color-border);
      border-radius: 16px;
      background: var(--color-surface);
    }
    .icon {
      display: inline-grid;
      place-items: center;
      width: 64px;
      height: 64px;
      background: var(--color-ice);
      color: var(--color-primary);
      border-radius: 16px;
    }
    h2 {
      font-size: 20px;
      margin: 24px 0 12px;
    }
    section p {
      color: var(--color-text-muted);
      line-height: 1.6;
      max-width: 420px;
      margin: 0 auto 24px;
    }
    section a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  `,
})
export class SectionPreviewComponent {
  private readonly route = inject(ActivatedRoute);
  protected get heading(): string {
    return this.route.snapshot.data['heading'];
  }
  protected get description(): string {
    return this.route.snapshot.data['description'];
  }
  protected get icon(): IconName {
    return this.route.snapshot.data['icon'];
  }
}
