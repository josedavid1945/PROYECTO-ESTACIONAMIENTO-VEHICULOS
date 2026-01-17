import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  registerForm: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validador de fortaleza de contraseña
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    
    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
    
    return passwordValid ? null : { weakPassword: true };
  }

  /**
   * Validador que compara las contraseñas
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authService.register({ firstName, lastName, email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('¡Cuenta creada exitosamente!');
        
        // Redirigir según el rol (por defecto será 'user')
        setTimeout(() => {
          this.router.navigate(['/usuario']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Error al crear la cuenta');
      }
    });
  }

  // Getters para validación en template
  get firstNameInvalid(): boolean {
    const control = this.registerForm.get('firstName');
    return !!(control?.invalid && control?.touched);
  }

  get lastNameInvalid(): boolean {
    const control = this.registerForm.get('lastName');
    return !!(control?.invalid && control?.touched);
  }

  get emailInvalid(): boolean {
    const control = this.registerForm.get('email');
    return !!(control?.invalid && control?.touched);
  }

  get passwordInvalid(): boolean {
    const control = this.registerForm.get('password');
    return !!(control?.invalid && control?.touched);
  }

  get confirmPasswordInvalid(): boolean {
    const control = this.registerForm.get('confirmPassword');
    return !!(control?.invalid && control?.touched);
  }

  /**
   * Calcula el porcentaje de fortaleza de la contraseña
   */
  get passwordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    return strength;
  }

  get passwordStrengthLabel(): string {
    const strength = this.passwordStrength;
    if (strength < 50) return 'Débil';
    if (strength < 75) return 'Media';
    if (strength < 100) return 'Buena';
    return 'Excelente';
  }

  get passwordStrengthColor(): string {
    const strength = this.passwordStrength;
    if (strength < 50) return 'bg-red-500';
    if (strength < 75) return 'bg-yellow-500';
    if (strength < 100) return 'bg-blue-500';
    return 'bg-green-500';
  }
}
