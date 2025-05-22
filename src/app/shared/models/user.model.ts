export interface User {
  id: string | number; // Mantengo string | number por si usas UUID o numérico
  username: string;
  password?: string; // Sigue siendo opcional en el modelo para el frontend
  role: 'admin' | 'user'; // Rol integrado directamente
  name?: string;
}
