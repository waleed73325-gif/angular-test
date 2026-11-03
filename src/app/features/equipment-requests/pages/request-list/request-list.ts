import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinner } from 'primeng/progressspinner';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

import { EquipmentRequestsService } from '../../services/equipment-requests';
import { DepartmentsService } from '../../../departments/services/departments';
import { EquipmentRequest, RequestStatus } from '../../models/equipment-request.model';
import { Department } from '../../../departments/models/department.model';
import { TranslatePipe } from '../../../../core/language/translate.pipe';
import { LanguageService } from '../../../../core/language/language';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    ProgressSpinner,
    IconField,
    InputIcon,
    TranslatePipe
  ],
  templateUrl: './request-list.html',
  styleUrl: './request-list.scss'
})
export class RequestList implements OnInit {
  private readonly svc = inject(EquipmentRequestsService);
  private readonly deptSvc = inject(DepartmentsService);
  private readonly router = inject(Router);
  private readonly msgSvc = inject(MessageService);
  private readonly confirmSvc = inject(ConfirmationService);
  readonly langService = inject(LanguageService);

  readonly loading = signal(false);
  readonly allRequests = signal<EquipmentRequest[]>([]);
  readonly departments = signal<Department[]>([]);

  readonly searchText = signal('');
  readonly filterStatus = signal<RequestStatus | 'All'>('All');

  readonly statusOptions = [
    { label: 'All', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  readonly filteredRequests = computed(() => {
    const text = this.searchText().toLowerCase().trim();
    const status = this.filterStatus();
    return this.allRequests().filter(r => {
      const matchStatus = status === 'All' || r.status === status;
      const matchText = !text ||
        r.requestNumber.toLowerCase().includes(text) ||
        r.employeeName.toLowerCase().includes(text) ||
        r.item.toLowerCase().includes(text);
      return matchStatus && matchText;
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.deptSvc.getAll().subscribe(d => this.departments.set(d));
    this.svc.getAll().subscribe({
      next: (data) => {
        this.allRequests.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getDeptName(deptId: string): string {
    return this.departments().find(d => d.id === deptId)?.name ?? deptId;
  }

  statusSeverity(status: RequestStatus): 'info' | 'warn' | 'success' {
    if (status === 'Draft') return 'info';
    if (status === 'Submitted') return 'warn';
    return 'success';
  }

  statusLabel(status: RequestStatus): string {
    const key: Record<RequestStatus, string> = {
      Draft: 'Requests.StatusDraft',
      Submitted: 'Requests.StatusSubmitted',
      Delivered: 'Requests.StatusDelivered'
    };
    return this.langService.t(key[status]);
  }

  navigateToNew(): void {
    void this.router.navigateByUrl('/equipment-requests/new');
  }

  navigateToEdit(req: EquipmentRequest): void {
    void this.router.navigateByUrl(`/equipment-requests/${req.id}/edit`);
  }

  confirmDelete(req: EquipmentRequest): void {
    if (req.status !== 'Draft') {
      this.msgSvc.add({
        severity: 'warn',
        summary: this.langService.t('Error'),
        detail: this.langService.t('Requests.DeleteDraftOnly')
      });
      return;
    }
    this.confirmSvc.confirm({
      message: this.langService.t('Requests.ConfirmDelete'),
      header: this.langService.t('Requests.DeleteRequest'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.langService.t('Yes'),
      rejectLabel: this.langService.t('No'),
      accept: () => this.deleteRequest(req.id)
    });
  }

  private deleteRequest(id: string): void {
    this.svc.delete(id).subscribe({
      next: () => {
        this.msgSvc.add({
          severity: 'success',
          summary: this.langService.t('Success'),
          detail: this.langService.t('Requests.DeleteSuccess')
        });
        this.allRequests.update(list => list.filter(r => r.id !== id));
      },
      error: () => {
        this.msgSvc.add({
          severity: 'error',
          summary: this.langService.t('Error'),
          detail: this.langService.t('Requests.DeleteError')
        });
      }
    });
  }

  formatCost(cost: number): string {
    return cost.toFixed(2);
  }
}
