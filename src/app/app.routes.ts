import {Routes} from '@angular/router';
import {HomeComponent} from './features/home/home.component';
import {LoginComponent} from './features/auth/login/login.component';
import {authGuard} from './core/guards/auth.guard';
import {roleGuard} from './core/guards/role.guard';
import {User} from './shared/models/user.model'; // Importar User

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar Sesión'
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: HomeComponent,
        title: 'Página Principal - Gestor de Stock'
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock-management/stock-management.component').then(m => m.StockManagementComponent),
        canActivate: [roleGuard],
        // Usar User['role'][] para el tipo del array
        data: {expectedRoles: ['admin', 'user'] as User['role'][]},
        title: 'Gestión de Stock'
      },
    ]
  },
  {path: '**', redirectTo: ''}
];
