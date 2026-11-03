import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';
import { Shell } from './core/layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login').then(m => m.Login)
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'equipment-requests',
        loadChildren: () =>
          import('./features/equipment-requests/equipment-requests.routes').then(m => m.equipmentRequestRoutes)
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/departments/departments.routes').then(m => m.departmentRoutes)
      },
      {
        path: '',
        redirectTo: 'equipment-requests',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
