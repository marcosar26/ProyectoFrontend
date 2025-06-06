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
      { // Ruta para la gestión de stock
        path: 'stock',
        loadComponent: () =>
          import('./features/stock/stock-management/stock-management.component').then(m => m.StockManagementComponent),
        canActivate: [roleGuard],
        data: {expectedRoles: ['admin', 'manager', 'user'] as User['role'][]},
        title: 'Gestión de Stock'
      },
      { // <--- NUEVA RUTA PARA HISTORIAL DE MOVIMIENTOS
        path: 'stock-movements',
        loadComponent: () =>
          import('./features/stock/stock-movements-history/stock-movements-history.component').then(m => m.StockMovementsHistoryComponent),
        canActivate: [roleGuard],
        data: {expectedRoles: ['admin', 'manager'] as User['role'][]}, // Admin y Manager pueden ver el historial
        title: 'Historial de Movimientos de Stock'
      },
      { // <--- NUEVA RUTA PARA DASHBOARD
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-view/dashboard-view.component').then(m => m.DashboardViewComponent),
        canActivate: [authGuard, roleGuard], // Proteger el dashboard
        data: {expectedRoles: ['admin', 'manager'] as User['role'][]}, // Solo Admin y Manager
        title: 'Dashboard de Inventario'
      },
      { // Ruta para gestión de usuarios
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
