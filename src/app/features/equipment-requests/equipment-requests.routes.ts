import { Routes } from '@angular/router';

export const equipmentRequestRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/request-list/request-list').then(m => m.RequestList)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/request-form/request-form').then(m => m.RequestForm)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/request-form/request-form').then(m => m.RequestForm)
  }
];

