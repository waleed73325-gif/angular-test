import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinner } from 'primeng/progressspinner';

import { DepartmentsService } from '../../services/departments';
import { Department } from '../../models/department.model';
import { TranslatePipe } from '../../../../core/language/translate.pipe';
import { LanguageService } from '../../../../core/language/language';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    ProgressSpinner,
    TranslatePipe
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.scss'
})
export class DepartmentList implements OnInit {
  private readonly svc = inject(DepartmentsService);
  private readonly fb = inject(FormBuilder);
  private readonly msgSvc = inject(MessageService);
  private readonly confirmSvc = inject(ConfirmationService);
  readonly langService = inject(LanguageService);

  readonly departments = signal<Department[]>([]);
  readonly loading = signal(false);
  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{2,10}$/)]],
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => {
        this.departments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  openEdit(dept: Department): void {
    this.editingId.set(dept.id);
    this.form.setValue({ code: dept.code, name: dept.name });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.form.reset();
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { code, name } = this.form.getRawValue();
    const allDepts = this.departments();
    const editId = this.editingId();

    // Uniqueness validation
    const codeExists = allDepts.some(d => d.code.toLowerCase() === code.toLowerCase() && d.id !== editId);
    const nameExists = allDepts.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== editId);

    if (codeExists) {
      this.form.controls.code.setErrors({ notUnique: true });
      return;
    }
    if (nameExists) {
      this.form.controls.name.setErrors({ notUnique: true });
      return;
    }

    this.saving.set(true);
    const payload = { code, name };
    const request$ = editId
      ? this.svc.update(editId, payload)
      : this.svc.create(payload);

    request$.subscribe({
      next: () => {
        this.msgSvc.add({
          severity: 'success',
          summary: this.langService.t('Success'),
          detail: this.langService.t('Departments.SaveSuccess')
        });
        this.closeDialog();
        this.loadDepartments();
        this.saving.set(false);
      },
      error: () => {
        this.msgSvc.add({
          severity: 'error',
          summary: this.langService.t('Error'),
          detail: this.langService.t('Departments.SaveError')
        });
        this.saving.set(false);
      }
    });
  }

  confirmDelete(dept: Department): void {
    this.confirmSvc.confirm({
      message: this.langService.t('Departments.ConfirmDelete'),
      header: this.langService.t('Departments.DeleteDepartment'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.langService.t('Yes'),
      rejectLabel: this.langService.t('No'),
      accept: () => this.deleteDepartment(dept.id)
    });
  }

  private deleteDepartment(id: string): void {
    this.svc.delete(id).subscribe({
      next: () => {
        this.msgSvc.add({
          severity: 'success',
          summary: this.langService.t('Success'),
          detail: this.langService.t('Departments.DeleteSuccess')
        });
        this.departments.update(list => list.filter(d => d.id !== id));
      },
      error: () => {
        this.msgSvc.add({
          severity: 'error',
          summary: this.langService.t('Error'),
          detail: this.langService.t('Departments.DeleteError')
        });
      }
    });
  }
}
