// src/app/core/auth/auth.service.ts
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {delay, tap} from 'rxjs/operators';
import {User} from '../../shared/models/user.model';

// --- USUARIOS DE PRUEBA (SOLO PARA DEMO) ---
const MOCK_USERS: User[] = [
  {id: '0', username: 'admin', password: 'admin', role: 'admin', name: 'Administrador Principal'},
  {id: '1', username: 'manager', password: 'manager', role: 'manager', name: 'Gerente de Tienda'}, // <--- NUEVO MANAGER
  {id: '2', username: 'user', password: 'user', role: 'user', name: 'Usuario Estándar'}, // ID actualizado
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getPersistedUser());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getPersistedUser());
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router) {
  }

  private getPersistedUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson) as User;
      // Asegurar que el rol sea válido si se carga desde localStorage
      if (['admin', 'manager', 'user'].includes(user.role)) {
        return user;
      }
      localStorage.removeItem('currentUser'); // Rol inválido, limpiar
    }
    return null;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get userRole(): User['role'] | null {
    return this.currentUserValue?.role || null;
  }

  login(usernameInput: string, passwordInput: string): Observable<User> {
    const user = MOCK_USERS.find(u => u.username === usernameInput && u.password === passwordInput);

    if (user) {
      return of(user).pipe(
        delay(500),
        tap(loggedInUser => {
          const {password, ...userToStore} = loggedInUser;
          localStorage.setItem('currentUser', JSON.stringify(userToStore));
          this.currentUserSubject.next(userToStore as User); // castear a User
          this.isAuthenticatedSubject.next(true);
        })
      );
    } else {
      return throwError(() => new Error('Usuario o contraseña incorrectos')).pipe(delay(500));
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(requiredRole: User['role'] | User['role'][]): boolean {
    if (!this.isLoggedIn() || !this.userRole) {
      return false;
    }
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(this.userRole);
    }
    return this.userRole === requiredRole;
  }
}
