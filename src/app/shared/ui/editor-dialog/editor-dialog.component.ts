import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { UnsavedChangesService } from '../../../core/forms/unsaved-changes.service';
import { ApplicationError } from '../../../core/errors/application-error';
import { DataStatusComponent } from '../data-status/data-status.component';
import { DialogStateService } from './dialog-state.service';

@Component({
  selector: 'app-editor-dialog',
  imports: [DataStatusComponent],
  host: { '(keydown)': 'trapFocus($event)' },
  template: `
    <dialog #dialog [attr.aria-label]="title()" (cancel)="escape($event)">
      <header class="editor-header">
        <h2 tabindex="-1" autofocus>{{ title() }}</h2>
        <button
          type="button"
          aria-label="Zatvori obrazac"
          [disabled]="changes.hasPendingChanges()"
          (click)="dismiss.emit()"
        >
          ×
        </button>
      </header>
      <div class="editor-body">
        <app-data-status [inDialog]="true" />
        @if (changes.hasPendingChanges()) {
          <p role="status">Spremam promjenu…</p>
        }
        @if (error()) {
          <div class="error-message" role="alert">
            <p>{{ error()?.message }}</p>
            @if (error()?.category === 'conflict') {
              <p>{{ conflictPrefix() }}: {{ conflictDescription() }}</p>
              <p>Lokalni unos ostaje sačuvan.</p>
              @if (restoreLabel()) {
                <button type="button" (click)="restore.emit()">{{ restoreLabel() }}</button>
              } @else {
                <p>
                  Za novi pregled zatvori obrazac i osvježi podatke. Prije odbacivanja sačuvaj
                  lokalni unos za usporedbu.
                </p>
              }
            }
          </div>
        }
        @if (message()) {
          <p class="error-message" role="alert">{{ message() }}</p>
        }
        <ng-content />
      </div>
    </dialog>
  `,
  styleUrl: './editor-dialog.component.scss',
})
export class EditorDialogComponent {
  readonly title = input.required<string>();
  readonly error = input<ApplicationError | null>(null);
  readonly message = input<string | null>(null);
  readonly conflictDescription = input('Osvježi za usporedbu');
  readonly conflictPrefix = input('Server verzija');
  readonly restoreLabel = input('');
  readonly dismiss = output<void>();
  readonly restore = output<void>();
  protected readonly changes = inject(UnsavedChangesService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor() {
    const state = inject(DialogStateService);
    state.count.update((count) => count + 1);
    const previous = document.activeElement;
    afterNextRender(() => this.dialog().nativeElement.showModal());
    inject(DestroyRef).onDestroy(() => {
      state.count.update((count) => count - 1);
      this.dialog().nativeElement.close();
      queueMicrotask(() => {
        const target =
          previous instanceof HTMLElement && previous.isConnected
            ? previous
            : document.getElementById('main-content');
        target?.focus({ preventScroll: true });
      });
    });
  }
  protected escape(event: Event): void {
    event.preventDefault();
    if (!this.changes.hasPendingChanges()) this.dismiss.emit();
  }
  protected trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = [
      ...this.dialog().nativeElement.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    const first = controls[0],
      last = controls.at(-1);
    if (!first) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        !controls.includes(document.activeElement as HTMLElement))
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
