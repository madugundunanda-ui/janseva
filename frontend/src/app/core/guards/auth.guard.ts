import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // Check if path requires specific roles
    const expectedRoles = route.data?.['roles'] as Array<string>;
    const userRole = authService.userRole();

    if (expectedRoles && userRole && !expectedRoles.includes(userRole)) {
      router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }

  // Redirect to login if unauthenticated
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
