import { Routes } from '@angular/router';

export const departmentRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/department-list/department-list').then(m => m.DepartmentList)
  }
];

