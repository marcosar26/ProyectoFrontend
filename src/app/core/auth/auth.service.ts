// src/app/core/auth/auth.service.ts
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {User} from '../../shared/models/user.model';
import {environment} from '../../../environments/environment';

// Interfaz para la respuesta del login del backend
interface JwtResponse {
  token: string;
  type?: string; // "Bearer"
  id?: number;
  username: string;
  roles: string[]; // Roles como vienen del backend (ej. "ADMIN", "USER")
}

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user'; // Para guardar info del usuario

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  constructor(private router: Router, private http: HttpClient) {
    const persistedUser = this.getPersistedUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(persistedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!persistedUser && !!this.getToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  // --- Métodos para el token ---
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveToken(token: string): void {
    localStorage.removeItem(TOKEN_KEY); // Asegurar que no haya tokens viejos
    localStorage.setItem(TOKEN_KEY, token);
  }

  // --- Métodos para el usuario persistido ---
  private getPersistedUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private saveUser(user: User): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private mapRolesFromBackend(backendRoles: string[]): User['role'] {
    // El backend devuelve un array, pero nuestro modelo User espera un solo rol.
    // Tomamos el rol más alto o el primero. Ajusta esta lógica según tu necesidad.
    // El backend devuelve roles como "ADMIN", "MANAGER", "USER".
    // El frontend espera "admin", "manager", "user".
    if (backendRoles.includes('ADMIN')) return 'admin';
    if (backendRoles.includes('MANAGER')) return 'manager';
    if (backendRoles.includes('USER')) return 'user';
    return 'user'; // Default o lanzar error
  }

  public login(usernameInput: string, passwordInput: string): Observable<User> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, {username: usernameInput, password: passwordInput})
      .pipe(
        tap(response => {
          this.saveToken(response.token);

          const userForFrontend: User = {
            id: response.id || Date.now(), // Usar ID de respuesta o un fallback si no viene
            username: response.username,
            role: this.mapRolesFromBackend(response.roles),
            name: response.username // Podrías añadir un endpoint /api/users/me para obtener más detalles
          };
          this.saveUser(userForFrontend);
          this.currentUserSubject.next(userForFrontend);
          this.isAuthenticatedSubject.next(true);
        }),
        map(response => { // Devolver el usuario mapeado para el frontend
          return {
            id: response.id || Date.now(),
            username: response.username,
            role: this.mapRolesFromBackend(response.roles),
            name: response.username
          } as User;
        }),
        catchError(this.handleLoginError)
      );
  }

  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get userRole(): User['role'] | null {
    return this.currentUserValue?.role || null;
  }

  public isLoggedIn(): boolean {
    // Considerar validar el token aquí si es necesario (ej. verificar expiración)
    // por ahora, confiamos en el interceptor y el estado del BehaviorSubject.
    return !!this.getToken() && this.isAuthenticatedSubject.value;
  }

  public hasRole(requiredRole: User['role'] | User['role'][]): boolean {
    if (!this.isLoggedIn() || !this.userRole) {
      return false;
    }
    const currentRole = this.userRole;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(currentRole);
    }
    return currentRole === requiredRole;
  }

  private handleLoginError(error: HttpErrorResponse) {
    let errorMessage = 'Error de inicio de sesión.';
    if (error.status === 401 || error.status === 403) {
      errorMessage = 'Usuario o contraseña incorrectos.';
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor de autenticación.';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error('Login API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
