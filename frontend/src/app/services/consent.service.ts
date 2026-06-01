import { Injectable, computed, signal } from '@angular/core';

interface ConsentPreferences {
  analytics: boolean | null;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  private static readonly STORAGE_KEY = 'fh_room_checker_consent_v1';

  private readonly preferencesSignal = signal<ConsentPreferences>(this.loadPreferences());

  readonly preferences = this.preferencesSignal.asReadonly();
  readonly hasAnswered = computed(() => this.preferences().analytics !== null);
  readonly analyticsAllowed = computed(() => this.preferences().analytics === true);

  acceptAnalytics(): void {
    this.savePreferences(true);
  }

  allowNecessaryOnly(): void {
    this.savePreferences(false);
  }

  private savePreferences(analytics: boolean): void {
    const nextValue: ConsentPreferences = {
      analytics,
      updatedAt: new Date().toISOString(),
    };

    this.preferencesSignal.set(nextValue);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(ConsentService.STORAGE_KEY, JSON.stringify(nextValue));
  }

  private loadPreferences(): ConsentPreferences {
    if (typeof window === 'undefined') {
      return { analytics: null, updatedAt: null };
    }

    try {
      const rawValue = window.localStorage.getItem(ConsentService.STORAGE_KEY);
      if (!rawValue) {
        return { analytics: null, updatedAt: null };
      }

      const parsed = JSON.parse(rawValue) as Partial<ConsentPreferences>;
      if (typeof parsed.analytics !== 'boolean') {
        return { analytics: null, updatedAt: null };
      }

      return {
        analytics: parsed.analytics,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      };
    } catch {
      return { analytics: null, updatedAt: null };
    }
  }
}
