import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {User} from '../../../shared/models/user.model';
import {UserService} from '../../../core/services/user.service'; // Ajusta la ruta si es necesario
import {AuthService} from '../../../core/auth/auth.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
    users$: Observable<User[]>;
    userForm: FormGroup;
    isEditing = false;
    currentUserId: string | number | null = null;
    showForm = false;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    readonly roles: User['role'][] = ['admin', 'manager', 'user'];
    loggedInUserId: string | number | null = null;


    private destroy$ = new Subject<void>();

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private fb: FormBuilder
    ) {
        this.users$ = this.userService.users$; // Usar el observable del servicio
        this.loggedInUserId = this.authService.currentUserValue?.id || null;

        this.userForm = this.fb.group({
            name: ['', Validators.maxLength(100)],
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)]], // Alfanumérico y guion bajo
            role: ['user' as User['role'], Validators.required],
            passwordInput: ['', [Validators.minLength(6)]], // Requerido solo al crear o si se quiere cambiar
            confirmPassword: ['']
        }, {validators: this.passwordConfirming});
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.isLoading = true; // Mostrar indicador de carga
        this.userService.getUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    // La lista se actualiza a través del BehaviorSubject en el servicio
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = err.message || 'Error al cargar usuarios.';
                    console.error(err);
                }
            });
    }

    passwordConfirming(control: AbstractControl): ValidationErrors | null {
        const password = control.get('passwordInput');
        const confirmPassword = control.get('confirmPassword');

        if (password?.pristine || confirmPassword?.pristine) {
            return null;
        }
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({'mismatch': true});
            return {'mismatch': true};
        } else {
            confirmPassword?.setErrors(null); // Limpiar error si coinciden o están vacíos correctamente
            return null;
        }
    }


    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    openNewUserForm(): void {
        this.isEditing = false;
        this.currentUserId = null;
        this.userForm.reset({role: 'user'}); // Reset y valor por defecto para rol
        // Hacer contraseña obligatoria al crear
        this.userForm.get('passwordInput')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
        this.userForm.get('passwordInput')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();
        this.showForm = true;
        this.clearMessages();
    }

    openEditUserForm(user: User): void {
        this.isEditing = true;
        this.currentUserId = user.id;
        this.userForm.patchValue({
            name: user.name || '',
            username: user.username,
            role: user.role,
        });
        // Hacer contraseña opcional al editar (solo si se quiere cambiar)
        this.userForm.get('passwordInput')?.setValidators([Validators.minLength(6)]);
        this.userForm.get('confirmPassword')?.setValidators([]); // Confirmación solo si se escribe contraseña
        this.userForm.get('passwordInput')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();
        this.userForm.get('passwordInput')?.reset(''); // Limpiar campos de contraseña
        this.userForm.get('confirmPassword')?.reset('');
        this.showForm = true;
        this.clearMessages();
    }

    onSubmit(): void {
        this.clearMessages();
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            this.errorMessage = "Por favor, corrige los errores en el formulario.";
            return;
        }

        this.isLoading = true;
        const formValue = this.userForm.value;

        let operation$: Observable<User>;

        if (this.isEditing && this.currentUserId !== null) {
            const updatePayload: Partial<Omit<User, 'id' | 'password'>> & { passwordInput?: string } = {
                name: formValue.name,
                username: formValue.username,
                role: formValue.role,
            };
            if (formValue.passwordInput) {
                updatePayload.passwordInput = formValue.passwordInput;
            }
            operation$ = this.userService.updateUser(this.currentUserId, updatePayload);
        } else {
            const createPayload: Omit<User, 'id'> & { passwordInput: string } = {
                name: formValue.name,
                username: formValue.username,
                role: formValue.role,
                passwordInput: formValue.passwordInput, // La contraseña es requerida
            };
            operation$ = this.userService.createUser(createPayload);
        }

        operation$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (savedUser) => {
                this.isLoading = false;
                this.successMessage = `Usuario ${this.isEditing ? 'actualizado' : 'creado'} exitosamente: ${savedUser.username}.`;
                this.cancelAndCloseForm();
                this.loadUsers(); // Recargar lista
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.message || `Error al ${this.isEditing ? 'actualizar' : 'crear'} usuario.`;
            }
        });
    }

    deleteUser(userId: string | number, username: string): void {
        this.clearMessages();
        if (userId === this.loggedInUserId) {
            this.errorMessage = "No puedes eliminar tu propia cuenta de administrador.";
            // Idealmente, usarías un modal de confirmación más elegante que window.confirm
            setTimeout(() => this.errorMessage = null, 5000);
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
            this.isLoading = true;
            this.userService.deleteUser(userId).pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.successMessage = `Usuario "${username}" eliminado exitosamente.`;
                    if (this.currentUserId === userId) {
                        this.cancelAndCloseForm();
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = err.message || `Error al eliminar usuario "${username}".`;
                }
            });
        }
    }

    cancelAndCloseForm(): void {
        this.showForm = false;
        this.isEditing = false;
        this.currentUserId = null;
        this.userForm.reset({role: 'user'});
        // Restaurar validadores por defecto (contraseña no obligatoria)
        this.userForm.get('passwordInput')?.setValidators([Validators.minLength(6)]);
        this.userForm.get('confirmPassword')?.setValidators([]);
        this.userForm.get('passwordInput')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();
    }

    private clearMessages(): void {
        this.errorMessage = null;
        this.successMessage = null;
    }

    // Getters para acceso fácil en el template
    get nameCtrl() {
        return this.userForm.get('name');
    }

    get usernameCtrl() {
        return this.userForm.get('username');
    }

    get roleCtrl() {
        return this.userForm.get('role');
    }

    get passwordInputCtrl() {
        return this.userForm.get('passwordInput');
    }

    get confirmPasswordCtrl() {
        return this.userForm.get('confirmPassword');
    }
}
