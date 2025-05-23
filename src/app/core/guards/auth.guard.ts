// src/app/core/guards/auth.guard.ts
import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../auth/auth.service'; // Ajusta ruta

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // No está logueado, redirigir a login guardando la URL de retorno
  router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
  return false;
};
