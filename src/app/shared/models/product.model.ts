export interface Product {
  id: string | number; // Usaremos string para un UUID o number para un autoincremental
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
