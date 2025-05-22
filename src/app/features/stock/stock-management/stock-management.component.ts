// src/app/features/stock/stock-management/stock-management.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Product} from '../../../shared/models/product.model';
import {User} from '../../../shared/models/user.model'; // Importar User
import {ProductService} from '../services/product.service';
import {AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css']
})
export class StockManagementComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  productForm: FormGroup;
  isEditing = false;
  currentProductId: string | number | null = null;
  showForm = false;

  userRole: User['role'] | null; // Usar User['role']
  canPerformWriteActions = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.userRole = this.authService.userRole;
    // El método hasRole ya está adaptado en AuthService
    this.canPerformWriteActions = this.authService.hasRole('admin');

    this.products$ = this.productService.getProducts();

    this.productForm = this.fb.group({
      name: [{value: '', disabled: !this.canPerformWriteActions}, Validators.required],
      description: [{value: '', disabled: !this.canPerformWriteActions}],
      price: [{value: null, disabled: !this.canPerformWriteActions}, [Validators.required, Validators.min(0.01)]],
      stock: [{value: null, disabled: !this.canPerformWriteActions}, [Validators.required, Validators.min(0)]],
      imageUrl: [{value: '', disabled: !this.canPerformWriteActions}]
    });
  }

  ngOnInit(): void {
    // Lógica de OnInit si es necesaria
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleForm(product?: Product): void {
    if (!this.canPerformWriteActions && (product || !this.showForm)) {
      return;
    }
    this.showForm = !this.showForm;

    if (this.showForm && product && this.canPerformWriteActions) {
      this.editProduct(product);
    } else if (!this.showForm) {
      this.cancelEdit();
    }
  }

  editProduct(product: Product): void {
    if (!this.canPerformWriteActions) return;

    this.isEditing = true;
    this.showForm = true;
    this.currentProductId = product.id;
    this.productForm.patchValue(product);
  }

  deleteProduct(id: string | number): void {
    if (!this.canPerformWriteActions) return;

    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              console.log('Producto eliminado');
              if (this.currentProductId === id) {
                this.cancelEdit();
              }
            } else {
              console.error('Error al eliminar producto');
            }
          },
          error: (err) => console.error('Error en la suscripción de eliminación:', err)
        });
    }
  }

  onSubmit(): void {
    if (!this.canPerformWriteActions) return;

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productData = this.productForm.value;

    if (this.isEditing && this.currentProductId !== null) {
      this.productService.updateProduct({...productData, id: this.currentProductId})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProduct) => {
            console.log('Producto actualizado:', updatedProduct);
            this.cancelEdit();
          },
          error: (err) => console.error('Error al actualizar producto:', err)
        });
    } else {
      this.productService.addProduct(productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newProduct) => {
            console.log('Producto añadido:', newProduct);
            this.cancelEdit();
          },
          error: (err) => console.error('Error al añadir producto:', err)
        });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.currentProductId = null;
    this.showForm = false;
    this.productForm.reset();
  }

  get name() {
    return this.productForm.get('name');
  }

  get price() {
    return this.productForm.get('price');
  }

  get stock() {
    return this.productForm.get('stock');
  }
}
