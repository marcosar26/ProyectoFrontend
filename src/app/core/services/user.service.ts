import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {User} from '../../shared/models/user.model'; // Modelo del frontend
import {environment} from '../../../environments/environment';

// DTOs que coinciden con los del backend para requests/responses específicas
interface UserResponseDTO { // Lo que esperamos del backend al listar/obtener
  id: number; // Asumimos Long se mapea a number
  username: string;
  role: 'ADMIN' | 'MANAGER' | 'USER'; // El enum del backend es en MAYÚSCULAS
  name?: string;
}

interface UserRequestDTO { // Lo que enviamos al backend para crear/actualizar
  username: string;
  password?: string; // Opcional en actualización
  role: 'ADMIN' | 'MANAGER' | 'USER';
  name?: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    // Podrías cargar usuarios aquí si siempre se necesitan al iniciar,
    // o dejar que el UserManagementComponent los cargue.
    // Por ahora, UserManagementComponent lo hará.
  }

  private mapBackendUserToFrontendUser(dto: UserResponseDTO): User {
    // Mapear rol de MAYÚSCULAS (backend) a minúsculas (frontend model)
    let roleFrontend: 'admin' | 'manager' | 'user';
    switch (dto.role) {
      case 'ADMIN':
        roleFrontend = 'admin';
        break;
      case 'MANAGER':
        roleFrontend = 'manager';
        break;
      case 'USER':
        roleFrontend = 'user';
        break;
      default:
        roleFrontend = 'user'; // o lanzar un error
    }
    return {
      id: dto.id,
      username: dto.username,
      role: roleFrontend,
      name: dto.name
      // la contraseña no viene del backend en UserResponseDTO
    };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<UserResponseDTO[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(this.mapBackendUserToFrontendUser)),
      tap(users => this.usersSubject.next(users)),
      catchError(this.handleError)
    );
  }

  getUserById(id: number | string): Observable<User | undefined> {
    return this.http.get<UserResponseDTO>(`${this.apiUrl}/${id}`).pipe(
      map(this.mapBackendUserToFrontendUser),
      catchError(this.handleError)
    );
  }

  // userData viene del formulario, la contraseña ya es 'passwordInput'
  createUser(userData: {
    username: string;
    passwordInput: string;
    role: User['role'];
    name?: string;
  }): Observable<User> {
    const requestPayload: UserRequestDTO = {
      username: userData.username,
      password: userData.passwordInput, // El backend espera 'password'
      role: userData.role.toUpperCase() as 'ADMIN' | 'MANAGER' | 'USER', // Enviar rol en MAYÚSCULAS
      name: userData.name
    };
    return this.http.post<UserResponseDTO>(this.apiUrl, requestPayload).pipe(
      map(this.mapBackendUserToFrontendUser),
      tap(newUser => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, newUser]);
      }),
      catchError(this.handleError)
    );
  }

  updateUser(userId: number | string, userData: {
    username?: string;
    passwordInput?: string;
    role?: User['role'];
    name?: string;
  }): Observable<User> {
    const requestPayload: Partial<UserRequestDTO> = {};
    if (userData.username) requestPayload.username = userData.username;
    if (userData.passwordInput) requestPayload.password = userData.passwordInput;
    if (userData.role) requestPayload.role = userData.role.toUpperCase() as 'ADMIN' | 'MANAGER' | 'USER';
    if (userData.name !== undefined) requestPayload.name = userData.name; // permitir enviar ""

    return this.http.put<UserResponseDTO>(`${this.apiUrl}/${userId}`, requestPayload).pipe(
      map(this.mapBackendUserToFrontendUser),
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === updatedUser.id);
        if (index > -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteUser(userId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next(currentUsers.filter(u => u.id !== userId));
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'Ocurrió un error desconocido con la gestión de usuarios.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor para usuarios. Verifique su conexión o el estado del backend.';
      } else if (typeof error.error === 'string' && error.error.length < 200) { // Si es un string de error del backend
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = `Error ${error.status}: ${error.error.message}`;
      } else {
        errorMessage = `Error del servidor al gestionar usuarios: ${error.status}, ${error.message || 'Error no especificado.'}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}
