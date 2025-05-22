import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {forkJoin, Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  // ... más stats
}

export interface MovementTypeStat { // Para el gráfico de pastel/barras
  name: string; // ej. 'ENTRADA', 'SALIDA'
  value: number; // ej. contador
}

export interface PeriodSummary {
  totalEntradas: number;
  totalSalidas: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private productApiUrl = `${environment.apiUrl}/products`;
  private movementApiUrl = `${environment.apiUrl}/stock-movements`;

  constructor(private http: HttpClient) {
  }

  getProductStats(): Observable<ProductStats> {
    return this.http.get<ProductStats>(`${this.productApiUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  getMovementsByTypeStats(): Observable<MovementTypeStat[]> {
    // El backend devuelve List<Map<String, Object>> con "type" y "count"
    // Necesitamos mapearlo a {name: string, value: number} para ngx-charts
    return this.http.get<Array<{ type: string, count: number }>>(`${this.movementApiUrl}/stats/movements-by-type`).pipe(
      map(backendStats => backendStats.map(stat => ({
        name: stat.type.charAt(0).toUpperCase() + stat.type.slice(1).toLowerCase(), // Capitalizar: "Entrada"
        value: stat.count
      }))),
      catchError(this.handleError)
    );
  }

  getMovementSummaryLastWeek(): Observable<PeriodSummary> {
    return this.http.get<PeriodSummary>(`${this.movementApiUrl}/stats/summary-last-week`).pipe(
      catchError(this.handleError)
    );
  }

  // Cargar todos los datos del dashboard a la vez
  getDashboardData(): Observable<{
    productStats: ProductStats,
    movementTypeStats: MovementTypeStat[],
    movementSummary: PeriodSummary
  }> {
    return forkJoin({
      productStats: this.getProductStats(),
      movementTypeStats: this.getMovementsByTypeStats(),
      movementSummary: this.getMovementSummaryLastWeek()
      // Añade más llamadas a forkJoin si tienes más datos que cargar
    }).pipe(
      catchError(this.handleError) // Manejar error general de forkJoin
    );
  }


  private handleError(error: HttpErrorResponse) {
    // ... (tu manejador de errores)
    console.error('Dashboard API Error:', error);
    let errorMessage = 'Ocurrió un error al cargar datos del dashboard.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión o el estado del backend.';
      } else if (typeof error.error === 'string') {
        errorMessage = `Error ${error.status}: ${error.error}`;
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
