import { TestBed } from '@angular/core/testing';
import { UnsavedChangesService } from './unsaved-changes.service';
describe('Unsaved changes and pending server confirmation', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('blocks navigation during a pending write and requests browser unload protection', () => {
    const changes = TestBed.inject(UnsavedChangesService);
    let pending = true;
    changes.registerPending(() => pending);
    expect(changes.canLeave()).toBe(false);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    pending = false;
    expect(changes.canLeave()).toBe(true);
  });
  it('keeps a draft only for the same signed-in RAM session and clears it on logout/account change', () => {
    const changes = TestBed.inject(UnsavedChangesService);
    changes.beginSession('owner');
    changes.keepDraft('rules', { total: 12 });
    changes.beginSession('owner');
    expect(changes.takeDraft('rules')).toEqual({ total: 12 });
    changes.keepDraft('rules', { total: 10 });
    changes.beginSession('other');
    expect(changes.takeDraft('rules')).toBeUndefined();
    changes.keepDraft('rules', { total: 8 });
    changes.discardDrafts();
    expect(changes.takeDraft('rules')).toBeUndefined();
  });
});
