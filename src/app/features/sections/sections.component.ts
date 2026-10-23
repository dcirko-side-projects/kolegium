import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { navigationItems } from '../../core/navigation/navigation';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-sections',
  imports: [RouterLink, IconComponent],
  template: `<div class="page-heading"><h1>Sve sekcije</h1></div>
    <p class="intro">Sve što ti treba za fakultet, lako dostupno.</p>
    <div class="grid">
      @for (item of navigation; track item.path) {
        <a [routerLink]="item.path"
          ><app-icon [name]="item.icon" />
          <div>
            <h2>{{ item.label }}</h2>
            <p>{{ item.description }}</p>
          </div>
          <span aria-hidden="true">→</span></a
        >
      }
    </div>`,
  styles: `
    .intro {
      color: var(--color-text-muted);
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-6);
    }
    a {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--space-6);
      background: var(--color-surface);
      color: var(--color-text);
      text-decoration: none;
    }
    a:hover {
      border-color: var(--color-primary);
      background: var(--color-ice);
    }
    app-icon {
      color: var(--color-primary);
      background: var(--color-blue-soft);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
    }
    h2 {
      font-size: 16px;
      margin: 0 0 8px;
    }
    p {
      font-size: 14px;
      color: var(--color-text-muted);
      margin: 0;
      line-height: 1.5;
    }
    a span {
      margin-left: auto;
      color: var(--color-primary);
    }
    @media (max-width: 767px) {
      .grid {
        grid-template-columns: 1fr;
      }
      a {
        padding: 20px;
      }
    }
  `,
})
export class SectionsComponent {
  protected readonly navigation = navigationItems;
}
