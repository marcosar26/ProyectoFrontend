// src/app/features/stock/stock-management/stock-management.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Product} from '../../../shared/models/product.model';
import {User} from '../../../shared/models/user.model';
import {ProductService} from '../services/product.service';
import {AuthService} from '../../../core/auth/auth.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css']
})
export class StockManagementComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  productForm: FormGroup;
  isEditing = false;
  currentProductId: string | number | null = null;
  showForm = false;

  userRole: User['role'] | null;
  canPerformWriteActions = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.userRole = this.authService.userRole;
    this.canPerformWriteActions = this.authService.hasRole(['admin', 'manager']); // <--- ACTUALIZADO

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

  // Método para mostrar el formulario para un nuevo producto
  openNewProductForm(): void {
    if (!this.canPerformWriteActions) {
      console.warn('Acción no permitida: Usuario no tiene permisos para añadir productos.');
      return;
    }
    this.isEditing = false;
    this.currentProductId = null;
    this.productForm.reset(); // Limpia el formulario y sus estados de validación
    this.showForm = true;
  }

  // Método para mostrar el formulario para editar un producto existente
  openEditProductForm(product: Product): void {
    if (!this.canPerformWriteActions) {
      console.warn('Acción no permitida: Usuario no tiene permisos para editar productos.');
      return;
    }
    this.isEditing = true;
    this.currentProductId = product.id;
    this.productForm.patchValue(product);
    this.showForm = true;
  }

  deleteProduct(id: string | number): void {
    if (!this.canPerformWriteActions) {
      console.warn('Acción no permitida: Usuario no tiene permisos para eliminar productos.');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Producto eliminado');
            if (this.currentProductId === id) { // Si se elimina el producto que se estaba editando
              this.cancelAndCloseForm();
            }
          },
          error: (err) => console.error('Error en la suscripción de eliminación:', err)
        });
    }
  }

  onSubmit(): void {
    if (!this.canPerformWriteActions) {
      console.warn('Acción no permitida: Usuario no tiene permisos para guardar productos.');
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    // Usamos getRawValue() por si los campos estuvieran deshabilitados por alguna razón no prevista
    // aunque la lógica de `disabled` en la creación del form y las guardias deberían prevenirlo.
    const productData = this.productForm.getRawValue();

    if (this.isEditing && this.currentProductId !== null) {
      this.productService.updateProduct({...productData, id: this.currentProductId})
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedProduct) => {
            console.log('Producto actualizado:', updatedProduct);
            this.cancelAndCloseForm();
          },
          error: (err) => console.error('Error al actualizar producto:', err)
        });
    } else {
      this.productService.addProduct(productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newProduct) => {
            console.log('Producto añadido:', newProduct);
            this.cancelAndCloseForm();
          },
          error: (err) => console.error('Error al añadir producto:', err)
        });
    }
  }

  // Método para cancelar la edición/creación y ocultar el formulario
  cancelAndCloseForm(): void {
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
