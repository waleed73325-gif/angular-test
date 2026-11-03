import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly currentLang = signal<'en' | 'ar'>((localStorage.getItem('lang') as 'en' | 'ar') || 'en');
  readonly currentDir = signal<'ltr' | 'rtl'>((localStorage.getItem('dir') as 'ltr' | 'rtl') || (this.currentLang() === 'ar' ? 'rtl' : 'ltr'));

  // Store loaded translations in a reactive signal
  readonly translations = signal<Record<string, any>>({});

  private readonly cache: Record<'en' | 'ar', Record<string, any> | null> = {
    en: null,
    ar: null
  };

  constructor() {
    this.applyDocumentAttributes(this.currentLang(), this.currentDir());
    this.loadTranslations(this.currentLang());
  }

  setLanguage(lang: 'en' | 'ar'): void {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.currentLang.set(lang);
    this.currentDir.set(dir);
    localStorage.setItem('lang', lang);
    localStorage.setItem('dir', dir);
    this.applyDocumentAttributes(lang, dir);
    this.loadTranslations(lang);
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(nextLang);
  }

  private applyDocumentAttributes(lang: string, dir: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.style.direction = dir;
    }
  }

  private async loadTranslations(lang: 'en' | 'ar'): Promise<void> {
    if (this.cache[lang]) {
      this.translations.set(this.cache[lang]!);
      return;
    }

    try {
      const response = await fetch(`/i18n/${lang}.json`);
      if (response.ok) {
        const data = await response.json();
        this.cache[lang] = data;
        this.translations.set(data);
      }
    } catch (err) {
      console.warn(`Could not load /i18n/${lang}.json, using fallback`, err);
    }
  }

  /**
   * Translates a key by navigating dotted path in the current dictionary
   * e.g. t('Login.Title') or t('Save')
   */
  t(key: string): string {
    const data = this.translations();
    if (!key) return '';

    const parts = key.split('.');
    let current: any = data;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return key; // Fallback to key if not found
      }
    }

    return typeof current === 'string' ? current : key;
  }
}
