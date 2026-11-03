import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { switchMap, of } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinner } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { EquipmentRequestsService } from '../../services/equipment-requests';
import { DepartmentsService } from '../../../departments/services/departments';
import { EquipmentRequest, RequestStatus } from '../../models/equipment-request.model';
import { Department } from '../../../departments/models/department.model';
import { TranslatePipe } from '../../../../core/language/translate.pipe';
import { LanguageService } from '../../../../core/language/language';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ProgressSpinner,
    MessageModule,
    TranslatePipe
  ],
  templateUrl: './request-form.html',
  styleUrl: './request-form.scss'
})
export class RequestForm implements OnInit {
  private readonly svc = inject(EquipmentRequestsService);
  private readonly deptSvc = inject(DepartmentsService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly msgSvc = inject(MessageService);
  readonly langService = inject(LanguageService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly currentRequest = signal<EquipmentRequest | null>(null);
  readonly departments = signal<Department[]>([]);
  readonly allRequests = signal<EquipmentRequest[]>([]);

  readonly isDelivered = computed(() => this.currentRequest()?.status === 'Delivered');
  readonly isSubmitted = computed(() => this.currentRequest()?.status === 'Submitted');
  readonly isNew = computed(() => !this.editingId());

  readonly departmentOptions = computed(() =>
    this.departments().map(d => ({ label: d.name, value: d.id }))
  );

  readonly itemOptions = [
    { label: 'Laptop', value: 'Laptop' },
    { label: 'Monitor', value: 'Monitor' },
    { label: 'Mobile', value: 'Mobile' },
    { label: 'Headset', value: 'Headset' }
  ];

  readonly statusOptions: { label: string; value: RequestStatus }[] = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  readonly todayDate = new Date();

  readonly form = this.fb.nonNullable.group({
    requestNumber: ['', [
      Validators.required,
      Validators.pattern(/^EQ-\d+$/)
    ]],
    employeeName: ['', [Validators.required, Validators.minLength(2)]],
    departmentId: ['', Validators.required],
    item: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    estimatedCost: [0, [Validators.required, Validators.min(0.01)]],
    neededOn: ['', Validators.required],
    status: ['Draft' as RequestStatus, Validators.required],
    reason: ['', Validators.maxLength(250)]
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.deptSvc.getAll().subscribe(d => this.departments.set(d));
    this.svc.getAll().subscribe(all => this.allRequests.set(all));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.svc.getById(id).subscribe({
        next: (req) => {
          this.currentRequest.set(req);
          this.patchForm(req);
          this.applyStatusRestrictions(req.status);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/equipment-requests');
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  private patchForm(req: EquipmentRequest): void {
    this.form.patchValue({
      requestNumber: req.requestNumber,
      employeeName: req.employeeName,
      departmentId: req.departmentId,
      item: req.item,
      quantity: req.quantity,
      estimatedCost: req.estimatedCost,
      neededOn: req.neededOn,
      status: req.status,
      reason: req.reason
    });
  }

  private applyStatusRestrictions(status: RequestStatus): void {
    if (status === 'Delivered') {
      this.form.disable();
      return;
    }
    if (status === 'Submitted') {
      // Only neededOn and reason can be edited
      this.form.controls.requestNumber.disable();
      this.form.controls.employeeName.disable();
      this.form.controls.departmentId.disable();
      this.form.controls.item.disable();
      this.form.controls.quantity.disable();
      this.form.controls.estimatedCost.disable();
      this.form.controls.status.disable();
    }
  }

  save(): void {
    if (this.isDelivered()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const editId = this.editingId();
    const allRequests = this.allRequests();

    // Validate unique requestNumber
    const numExists = allRequests.some(
      r => r.requestNumber === raw.requestNumber && r.id !== editId
    );
    if (numExists) {
      this.form.controls.requestNumber.setErrors({ notUnique: true });
      return;
    }

    // Validate cost decimal places (max 2)
    const costStr = raw.estimatedCost.toString();
    const dotIdx = costStr.indexOf('.');
    if (dotIdx !== -1 && costStr.length - dotIdx - 1 > 2) {
      this.form.controls.estimatedCost.setErrors({ maxDecimals: true });
      return;
    }

    this.saving.set(true);
    const payload: Omit<EquipmentRequest, 'id'> = {
      requestNumber: raw.requestNumber,
      employeeName: raw.employeeName,
      departmentId: raw.departmentId,
      item: raw.item,
      quantity: Number(raw.quantity),
      estimatedCost: Number(raw.estimatedCost),
      neededOn: raw.neededOn,
      status: raw.status as RequestStatus,
      reason: raw.reason
    };

    const request$ = editId
      ? this.svc.update(editId, payload)
      : this.svc.create(payload);

    request$.subscribe({
      next: () => {
        this.msgSvc.add({
          severity: 'success',
          summary: this.langService.t('Success'),
          detail: this.langService.t('Requests.SaveSuccess')
        });
        this.saving.set(false);
        void this.router.navigateByUrl('/equipment-requests');
      },
      error: () => {
        this.msgSvc.add({
          severity: 'error',
          summary: this.langService.t('Error'),
          detail: this.langService.t('Requests.SaveError')
        });
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/equipment-requests');
  }
}
