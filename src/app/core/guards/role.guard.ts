import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../auth/auth.service'; // Ajusta ruta
import {User} from '../../shared/models/user.model'; // Importar User

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Usar User['role'] para el tipo
  const expectedRoles = route.data['expectedRoles'] as User['role'][] | User['role'] | undefined;

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
    return false;
  }

  if (!expectedRoles) {
    return true;
  }

  if (!authService.hasRole(expectedRoles)) {
    console.warn(`RoleGuard: User does not have one of the required roles: ${expectedRoles}. Access denied.`);
    router.navigate(['/']);
    return false;
  }

  return true;
};
