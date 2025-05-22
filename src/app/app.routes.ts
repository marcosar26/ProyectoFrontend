import {Routes} from '@angular/router';
import {HomeComponent} from './features/home/home.component';
import {LoginComponent} from './features/auth/login/login.component';
import {authGuard} from './core/guards/auth.guard';
import {roleGuard} from './core/guards/role.guard';
import {User} from './shared/models/user.model';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar Sesión'
  },
  {
    path: '',
    canActivate: [authGuard], // Protege todas las rutas hijas
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
        canActivate: [roleGuard], // Ya estaba, verifica que los roles sean correctos
        data: {expectedRoles: ['admin', 'manager', 'user'] as User['role'][]}, // 'user' solo puede listar
        title: 'Gestión de Stock'
      },
      { // <--- NUEVA RUTA PARA GESTIÓN DE USUARIOS
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [roleGuard],
        data: {expectedRoles: ['admin'] as User['role'][]}, // Solo admin puede gestionar usuarios
        title: 'Gestión de Usuarios'
      },
    ]
  },
  // Ruta comodín al final
  {path: '**', redirectTo: ''}
];
