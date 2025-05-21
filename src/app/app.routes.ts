// src/app/app.routes.ts
import {Routes} from '@angular/router';
// Asegúrate de que la importación del HomeComponent es correcta según tu estructura
import {HomeComponent} from './features/home/home.component';

export const routes: Routes = [
  {
    path: '', // Ruta raíz
    component: HomeComponent, // Carga HomeComponent directamente (ya es standalone)
    title: 'Página Principal - Gestor de Stock'
  },
  {
    path: 'stock',
    loadComponent: () =>
      import('./features/stock/stock-management/stock-management.component').then(m => m.StockManagementComponent),
    title: 'Gestión de Stock'
  },
  // Considera una ruta '**' para manejar páginas no encontradas (PageNotFoundComponent)
  // { path: '**', loadComponent: () => import('./core/components/not-found/not-found.component').then(c => c.NotFoundComponent) }
];
