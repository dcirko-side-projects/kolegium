import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { signal } from '@angular/core';
import { AuthService } from './data/auth.service';
import { AcademicStoreService } from './core/academic/academic-store.service';

describe('Authenticated shell routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: {
            status: signal('allowed'),
            user: signal({ uid: 'local-owner' }),
            ready: Promise.resolve(),
            isLocal: true,
            busy: signal(false),
            error: signal(null),
          },
        },
        {
          provide: AcademicStoreService,
          useValue: {
            online: signal(true),
            stale: signal(false),
            datasetChanged: signal(false),
            locked: signal(false),
            loading: signal(false),
            busy: signal(false),
            error: signal(null),
            scope: signal(null),
            control: signal(null),
            ready: signal(false),
            courses: signal([]),
            selectedSemesterId: signal(null),
            selectedSemester: signal(null),
            canWrite: () => false,
            moreCourses: () => false,
          },
        },
      ],
    }),
  );

  it('opens an approved direct thesis link without academic data', async () => {
    const harness = await RouterTestingHarness.create('/thesis');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Diplomski');
    expect(harness.routeNativeElement?.textContent).toContain('još nije poznata');
  });

  it('opens projects and installments', async () => {
    const harness = await RouterTestingHarness.create('/projects');
    await harness.navigateByUrl('/installments');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe(
      'Rate fakulteta',
    );
  });

  it('makes thesis and installments reachable through the mobile section directory', async () => {
    const harness = await RouterTestingHarness.create('/sections');
    expect(harness.routeNativeElement?.querySelector('a[href="/thesis"]')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('a[href="/installments"]')).toBeTruthy();
  });

  it('offers a recovery link for an unknown URL', async () => {
    const harness = await RouterTestingHarness.create('/missing-section');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe(
      'Stranica nije pronađena',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Povratak na početnu');
  });
});
