import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {map} from 'rxjs/operators';
import {Product} from '../../../shared/models/product.model'; // Ajusta la ruta si es necesario

@Injectable({
  providedIn: 'root' // Servicio disponible en toda la aplicación
})
export class ProductService {
  // Usaremos un BehaviorSubject para simular una base de datos en memoria y que los cambios se reflejen
  private productsSubject = new BehaviorSubject<Product[]>([]);
  products$: Observable<Product[]> = this.productsSubject.asObservable();

  private _products: Product[] = [
    {
      id: this.generateId(),
      name: 'Laptop Pro X',
      description: 'Potente laptop para profesionales',
      price: 1200,
      stock: 15,
      imageUrl: 'https://via.placeholder.com/150/0000FF/808080?Text=Laptop'
    },
    {
      id: this.generateId(),
      name: 'Smartphone Z',
      description: 'Última generación de smartphone',
      price: 800,
      stock: 25,
      imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=Smartphone'
    },
    {
      id: this.generateId(),
      name: 'Auriculares BT',
      description: 'Sonido inmersivo y sin cables',
      price: 150,
      stock: 50,
      imageUrl: 'https://via.placeholder.com/150/008000/FFFFFF?Text=Auriculares'
    },
  ];

  constructor() {
    this.productsSubject.next([...this._products]); // Emitir la lista inicial
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15); // Simple ID generator
  }

  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  getProductById(id: string | number): Observable<Product | undefined> {
    return this.products$.pipe(
      map(products => products.find(p => p.id === id))
    );
  }

  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    const newProduct: Product = {...product, id: this.generateId()};
    this._products = [...this._products, newProduct];
    this.productsSubject.next([...this._products]);
    return of(newProduct);
  }

  updateProduct(updatedProduct: Product): Observable<Product> {
    const index = this._products.findIndex(p => p.id === updatedProduct.id);
    if (index > -1) {
      this._products[index] = updatedProduct;
      this.productsSubject.next([...this._products]);
      return of(updatedProduct);
    }
    return throwError(() => new Error('Producto no encontrado para actualizar'));
  }

  deleteProduct(id: string | number): Observable<boolean> {
    const initialLength = this._products.length;
    this._products = this._products.filter(p => p.id !== id);
    if (this._products.length < initialLength) {
      this.productsSubject.next([...this._products]);
      return of(true);
    }
    return of(false); // O throwError si prefieres
  }
}
