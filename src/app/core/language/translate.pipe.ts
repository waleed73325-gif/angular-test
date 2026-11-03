import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Ensures pipe updates reactively when language signal changes
})
export class TranslatePipe implements PipeTransform {
  private readonly langService = inject(LanguageService);

  transform(key: string): string {
    return this.langService.t(key);
  }
}

