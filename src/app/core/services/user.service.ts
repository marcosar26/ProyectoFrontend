import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {delay} from 'rxjs/operators';
import {User} from '../../shared/models/user.model';

// Simulación de base de datos de usuarios en memoria
let MOCK_DB_USERS: User[] = [
  {id: '0', username: 'admin', role: 'admin', name: 'Administrador Principal', password: 'admin'},
  {id: '1', username: 'manager', role: 'manager', name: 'Gerente de Tienda', password: 'manager'},
  {id: '2', username: 'user', role: 'user', name: 'Usuario Estándar', password: 'user'},
  {id: '3', username: 'another_user', role: 'user', name: 'Otro Usuario', password: 'password'},
];

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor() {
    // Clonar para evitar modificar directamente MOCK_DB_USERS desde fuera
    this.usersSubject.next([...MOCK_DB_USERS].map(u => {
      const {password, ...userWithoutPassword} = u; // No exponer contraseñas
      return userWithoutPassword as User;
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  getUsers(): Observable<User[]> {
    // Simular retardo de API
    return of([...MOCK_DB_USERS].map(u => {
      const {password, ...userWithoutPassword} = u;
      return userWithoutPassword as User;
    })).pipe(delay(300));
  }

  getUserById(id: string | number): Observable<User | undefined> {
    const user = MOCK_DB_USERS.find(u => u.id === id);
    if (user) {
      const {password, ...userWithoutPassword} = user;
      return of(userWithoutPassword as User).pipe(delay(100));
    }
    return of(undefined).pipe(delay(100));
  }

  // Al crear un usuario, la contraseña es necesaria
  createUser(userData: Omit<User, 'id'> & { passwordInput: string }): Observable<User> {
    if (MOCK_DB_USERS.some(u => u.username === userData.username)) {
      return throwError(() => new Error('El nombre de usuario ya existe.'));
    }
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      password: userData.passwordInput // En un backend real, esto se haría hash
    };
    MOCK_DB_USERS.push(newUser);
    this.refreshUsersList();
    const {password, ...userToReturn} = newUser;
    return of(userToReturn as User).pipe(delay(300));
  }

  // Para actualizar, la contraseña es opcional (si se quiere cambiar)
  updateUser(userId: string | number, userData: Partial<Omit<User, 'id' | 'password'>> & {
    passwordInput?: string
  }): Observable<User> {
    const index = MOCK_DB_USERS.findIndex(u => u.id === userId);
    if (index > -1) {
      // No permitir cambiar el nombre de usuario si ya existe (excepto para el usuario actual)
      if (userData.username && userData.username !== MOCK_DB_USERS[index].username && MOCK_DB_USERS.some(u => u.username === userData.username)) {
        return throwError(() => new Error('El nuevo nombre de usuario ya está en uso por otro usuario.'));
      }

      const updatedUser = {...MOCK_DB_USERS[index], ...userData};
      if (userData.passwordInput) {
        updatedUser.password = userData.passwordInput; // Actualizar contraseña
      }
      MOCK_DB_USERS[index] = updatedUser;
      this.refreshUsersList();
      const {password, ...userToReturn} = updatedUser;
      return of(userToReturn as User).pipe(delay(300));
    }
    return throwError(() => new Error('Usuario no encontrado para actualizar.')).pipe(delay(300));
  }

  deleteUser(userId: string | number): Observable<boolean> {
    const initialLength = MOCK_DB_USERS.length;
    MOCK_DB_USERS = MOCK_DB_USERS.filter(u => u.id !== userId);
    if (MOCK_DB_USERS.length < initialLength) {
      this.refreshUsersList();
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300)); // O throwError
  }

  private refreshUsersList(): void {
    this.usersSubject.next([...MOCK_DB_USERS].map(u => {
      const {password, ...userWithoutPassword} = u;
      return userWithoutPassword as User;
    }));
  }
}
