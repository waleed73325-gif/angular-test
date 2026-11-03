import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  username: string;
  password: string;
  token: string;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/users';
  private readonly tokenKey = 'token';
  private readonly userKey = 'auth_user';
  private readonly validToken = 'eq-static-token';

  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());

  login(username: string, password: string): Observable<boolean> {
    return this.http.get<AuthUser[]>(this.apiUrl).pipe(
      map(users => {
        const user = users.find(
          item => item.username === username && item.password === password
        );
        return user ?? null;
      }),
      tap(user => {
        if (user) {
          localStorage.setItem(this.tokenKey, user.token);
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUser.set(user);
        }
      }),
      map(user => user !== null)
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  getDisplayName(): string {
    return this.currentUser()?.displayName || 'Sara Ali';
  }

  isAuthenticated(): boolean {
    return this.getToken() === this.validToken;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }
}
