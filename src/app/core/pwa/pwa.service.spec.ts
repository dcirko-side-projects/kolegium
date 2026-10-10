import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PwaService } from './pwa.service';
import { AcademicStoreService } from '../academic/academic-store.service';
import { UnsavedChangesService } from '../forms/unsaved-changes.service';
describe('PWA protects work before update', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('blocks update during dirty input, a pending write, restore, offline or stale dataset', () => {
    let unsafe = false;
    const busy = signal(false),
      changed = signal(false),
      control = signal<{ restoreToken: string | null }>({ restoreToken: null });
    TestBed.configureTestingModule({
      providers: [
        { provide: UnsavedChangesService, useValue: { hasUnsafeChanges: () => unsafe } },
        { provide: AcademicStoreService, useValue: { busy, datasetChanged: changed, control } },
      ],
    });
    const service = TestBed.inject(PwaService);
    expect(service.canUpdate()).toBe(true);
    unsafe = true;
    expect(service.canUpdate()).toBe(false);
    unsafe = false;
    busy.set(true);
    expect(service.canUpdate()).toBe(false);
    busy.set(false);
    control.set({ restoreToken: 'locked' });
    expect(service.canUpdate()).toBe(false);
    control.set({ restoreToken: null });
    changed.set(true);
    expect(service.canUpdate()).toBe(false);
    changed.set(false);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(service.canUpdate()).toBe(false);
    vi.restoreAllMocks();
  });
});
