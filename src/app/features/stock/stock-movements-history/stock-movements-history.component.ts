import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router'; // RouterLink si necesitas volver
import {Observable, of, Subject, switchMap} from 'rxjs';
import {catchError, takeUntil, tap} from 'rxjs/operators';
import {StockMovement} from '../../../shared/models/stock-movement.model';
import {StockMovementService} from '../services/stock-movement.service';
import {ProductService} from '../services/product.service'; // Para obtener el nombre del producto si filtramos por ID


@Component({
  selector: 'app-stock-movements-history',
  standalone: true,
  imports: [CommonModule, RouterLink], // DatePipe para formatear fechas
  templateUrl: './stock-movements-history.component.html',
  styleUrls: ['./stock-movements-history.component.css']
})
export class StockMovementsHistoryComponent implements OnInit, OnDestroy {
  movements$: Observable<StockMovement[]> | undefined;
  isLoading = false;
  errorMessage: string | null = null;
  filterProductId: number | null = null;
  productName: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private stockMovementService: StockMovementService,
    private productService: ProductService, // Para obtener nombre si filtramos
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe( // Escuchar cambios en queryParams para filtrar por producto
      takeUntil(this.destroy$),
      tap(params => {
        this.isLoading = true;
        this.errorMessage = null;
        this.productName = null;
        const productIdParam = params.get('productId');
        this.filterProductId = productIdParam ? +productIdParam : null;
      }),
      switchMap(() => {
        if (this.filterProductId !== null) {
          // Cargar nombre del producto si estamos filtrando
          this.productService.getProductById(this.filterProductId).pipe(takeUntil(this.destroy$)).subscribe(prod => this.productName = prod?.name || null);
          return this.stockMovementService.getMovementsByProductId(this.filterProductId);
        }
        return this.stockMovementService.getAllMovements();
      }),
      catchError(err => {
        this.errorMessage = err.message || 'Error al cargar el historial de movimientos.';
        this.isLoading = false;
        return of([]); // Devuelve un array vacío en caso de error para que el template no falle
      })
    ).subscribe({
      next: (movements) => {
        // movements$ se asignará directamente por el pipe async en el template si se quiere
        // o se puede asignar a una variable local. Para este ejemplo, lo asignaremos.
        this.movements$ = of(movements);
        this.isLoading = false;
      },
      // El error ya se maneja en catchError
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMovementTypeClass(type: StockMovement['type']): string {
    switch (type) {
      case 'ENTRADA':
        return 'text-success';
      case 'AJUSTE_INICIAL':
        return 'text-primary';
      case 'SALIDA':
        return 'text-danger';
      case 'CORRECCION':
        return 'text-warning';
      default:
        return '';
    }
  }

  getQuantityDisplay(movement: StockMovement): string {
    if (movement.type === 'SALIDA' || movement.type === 'CORRECCION' && movement.quantityChanged < 0) {
      return `-${Math.abs(movement.quantityChanged)}`;
    }
    return `+${movement.quantityChanged}`;
  }
}
