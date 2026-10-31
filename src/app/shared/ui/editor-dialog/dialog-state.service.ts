import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DialogStateService {
  readonly count = signal(0);
}
