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
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      dialog.showModal();
      dialog.addEventListener('submit', this.validateFields, true);
      dialog.addEventListener('input', this.clearFieldError);
    });
    inject(DestroyRef).onDestroy(() => {
      state.count.update((count) => count - 1);
      this.dialog().nativeElement.removeEventListener('submit', this.validateFields, true);
      this.dialog().nativeElement.removeEventListener('input', this.clearFieldError);
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
  private readonly clearFieldError = (event: Event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement) || !field.id) return;
    const id = field.id + '-validation';
    const message = document.getElementById(id);
    if (!message) return;
    message.remove();
    field.removeAttribute('aria-invalid');
    const remaining = (field.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter((value) => value && value !== id);
    if (remaining.length) field.setAttribute('aria-describedby', remaining.join(' '));
    else field.removeAttribute('aria-describedby');
  };
  private readonly validateFields = (event: Event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    for (const field of event.target.elements) {
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        ) ||
        !field.id ||
        field.disabled
      )
        continue;
      const label = field.labels?.[0]?.textContent?.trim() ?? 'Polje';
      const missing = field.required && !field.value.trim();
      if (!missing && field.validity.valid) continue;
      const id = field.id + '-validation';
      if (!document.getElementById(id)) {
        const message = document.createElement('p');
        message.id = id;
        message.className = 'error-message';
        message.setAttribute('role', 'alert');
        message.textContent = missing
          ? label + ' je obvezno polje.'
          : (field.dataset['invalidMessage'] ?? label + ' — provjeri format unosa.');
        field.after(message);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute(
          'aria-describedby',
          [field.getAttribute('aria-describedby'), id].filter(Boolean).join(' '),
        );
      }
      event.preventDefault();
      event.stopPropagation();
      field.focus();
      return;
    }
  };
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
