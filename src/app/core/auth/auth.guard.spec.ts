import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { AuthService, AuthStatus } from '../../data/auth.service';
import { authGuard } from './auth.guard';
describe('Private route gate', () => {
  const status = signal<AuthStatus>('signedOut');
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { status, ready: Promise.resolve() } },
      ],
    }),
  );
  it('allows the approved session', async () => {
    status.set('allowed');
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/courses' } as RouterStateSnapshot),
    );
    expect(result).toBe(true);
  });
  it('redirects signed-out, forbidden and unconfigured states while keeping the intended route', async () => {
    for (const state of ['signedOut', 'forbidden', 'unconfigured'] as AuthStatus[]) {
      status.set(state);
      const result = await TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, { url: '/courses/example' } as RouterStateSnapshot),
      );
      expect(
        TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>),
      ).toBe('/login?returnUrl=%2Fcourses%2Fexample');
    }
  });
});
