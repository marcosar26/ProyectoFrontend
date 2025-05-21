// src/app/features/stock/stock-management/stock-management.component.ts
import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Product} from '../../../shared/models/product.model'; // Ajusta la ruta
import {ProductService} from '../services/product.service'; // Ajusta la ruta

@Component({
  selector: 'app-stock-management',
  standalone: true,
  imports: [
    CommonModule, // Necesario para *ngFor, *ngIf, etc.
    ReactiveFormsModule // Necesario para Reactive Forms
  ],
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css']
})
export class StockManagementComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  productForm: FormGroup;
  isEditing = false;
  currentProductId: string | number | null = null;
  showForm = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.products$ = this.productService.getProducts();

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [null, [Validators.required, Validators.min(0.01)]],
      stock: [null, [Validators.required, Validators.min(0)]],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    // Podrías cargar productos aquí si el servicio no lo hace al inicio
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleForm(product?: Product): void {
    this.showForm = !this.showForm;
    if (this.showForm && product) {
      this.editProduct(product);
    } else if (!this.showForm) {
      this.cancelEdit(); // Resetea el formulario si se oculta
    }
  }

  loadProducts(): void {
    // Ya se cargan a través del BehaviorSubject en el servicio,
    // pero si necesitaras un refresh manual, podrías llamar a un método en el servicio.
  }

  editProduct(product: Product): void {
    this.isEditing = true;
    this.showForm = true;
    this.currentProductId = product.id;
    this.productForm.patchValue(product);
  }

  deleteProduct(id: string | number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      this.productService.deleteProduct(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              console.log('Producto eliminado');
              if (this.currentProductId === id) { // Si el producto eliminado era el que se estaba editando
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
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar errores
      return;
    }

    const productData = this.productForm.value;

    if (this.isEditing && this.currentProductId !== null) {
      // Actualizar producto
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
      // Crear nuevo producto
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

  // Helpers para acceder fácilmente a los controles del formulario en la plantilla
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
