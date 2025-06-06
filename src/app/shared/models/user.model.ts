export interface User {
  id: string | number;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'user'; // <--- AÑADIDO 'manager'
  name?: string;
}
