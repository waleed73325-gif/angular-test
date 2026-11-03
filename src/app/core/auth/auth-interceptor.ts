import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // The users request used by login goes out without a token
  if (req.url.includes('/users')) {
    return next(req);
  }

  // Every other request reads the token from localStorage
  const token = localStorage.getItem('token');
  const validToken = 'eq-static-token';

  // The token is valid only when it equals the seeded value eq-static-token
  // A missing or different token does not get sent. Clear the stored session and open /login.
  if (!token || token !== validToken) {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    void router.navigateByUrl('/login');
    return EMPTY;
  }

  // A valid token is sent as Authorization: Bearer eq-static-token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
