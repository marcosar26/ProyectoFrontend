import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {StockMovement} from '../../../shared/models/stock-movement.model';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  private apiUrl = `${environment.apiUrl}/stock-movements`;

  constructor(private http: HttpClient) {
  }

  getAllMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getMovementsByProductId(productId: number | string): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${this.apiUrl}/product/${productId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error (StockMovementService):', error);
    let errorMessage = 'Ocurrió un error con los movimientos de stock.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión o el estado del backend.';
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = `Error ${error.status}: ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage = `Error ${error.status}: ${error.error.message}`;
      } else {
        errorMessage = `Error del servidor: ${error.status}, ${error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
