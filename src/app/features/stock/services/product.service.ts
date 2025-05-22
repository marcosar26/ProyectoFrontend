import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Product} from '../../../shared/models/product.model';
import {environment} from '../../../../environments/environment'; // Importar environment

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`; // URL base para productos

  // BehaviorSubject para mantener la lista de productos actualizada en el frontend
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$: Observable<Product[]> = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialProducts(); // Cargar productos al iniciar el servicio
  }

  private loadInitialProducts(): void {
    this.http.get<Product[]>(this.apiUrl).pipe(
      tap(products => this.productsSubject.next(products)),
      catchError(this.handleError)
    ).subscribe({
      error: err => console.error('Error cargando productos iniciales:', err)
      // No necesitas hacer nada en next aquí porque el tap ya actualizó el subject
    });
  }

  // Opcional: método para recargar explícitamente si es necesario desde algún componente
  public refreshProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap(products => {
        this.productsSubject.next(products);
      }),
      catchError(this.handleError)
    );
  }

  getProducts(): Observable<Product[]> {
    // Devuelve el observable del BehaviorSubject para que los componentes se suscriban
    // y reciban actualizaciones automáticas.
    // La carga inicial y las actualizaciones (add, update, delete) modificarán el BehaviorSubject.
    return this.products$;
  }

  getProductById(id: number | string): Observable<Product | undefined> {
    // El backend espera un Long, así que el ID debería ser numérico
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap(newProduct => {
        // Actualizar la lista localmente después de una creación exitosa
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next([...currentProducts, newProduct]);
      }),
      catchError(this.handleError)
    );
  }

  updateProduct(updatedProduct: Product): Observable<Product> {
    // Asegurarse que el ID es parte de la URL y el cuerpo
    if (updatedProduct.id === undefined || updatedProduct.id === null) {
      return throwError(() => new Error('El ID del producto es necesario para actualizar.'));
    }
    return this.http.put<Product>(`${this.apiUrl}/${updatedProduct.id}`, updatedProduct).pipe(
      tap(returnedProduct => {
        // Actualizar la lista localmente
        const currentProducts = this.productsSubject.value;
        const index = currentProducts.findIndex(p => p.id === returnedProduct.id);
        if (index > -1) {
          currentProducts[index] = returnedProduct;
          this.productsSubject.next([...currentProducts]);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteProduct(id: number | string): Observable<void> { // El backend devuelve 204 No Content (void)
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Actualizar la lista localmente
        const currentProducts = this.productsSubject.value;
        this.productsSubject.next(currentProducts.filter(p => p.id !== id));
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'Ocurrió un error desconocido.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend devolvió un código de error
      // El cuerpo del error puede contener pistas sobre qué salió mal
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
