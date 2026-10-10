import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../data/auth.service';
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService),
    router = inject(Router);
  await auth.ready;
  return auth.status() === 'allowed'
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
