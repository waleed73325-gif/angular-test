import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth';
import { TranslatePipe } from '../../core/language/translate.pipe';
import { LanguageService } from '../../core/language/language';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly langService = inject(LanguageService);

  readonly isSubmitting = signal(false);
  readonly hasError = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submitLogin(): void {
    this.hasError.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { username, password } = this.loginForm.getRawValue();

    this.authService.login(username, password).subscribe({
      next: (success) => {
        this.isSubmitting.set(false);
        if (success) {
          this.router.navigateByUrl('/equipment-requests');
        } else {
          this.hasError.set(true);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.hasError.set(true);
      }
    });
  }
}
