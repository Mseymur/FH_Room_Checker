import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';

import { AnalyticsService } from './services/analytics.service';
import { ConsentService } from './services/consent.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [CommonModule, IonApp, IonRouterOutlet],
})
export class AppComponent {
  readonly consentService = inject(ConsentService);
  readonly analyticsService = inject(AnalyticsService);
  readonly preferencesOpen = signal(!this.consentService.hasAnswered());
  readonly showConsentBanner = computed(() => this.preferencesOpen());

  private readonly openPrivacySettingsHandler = () => {
    this.openPreferences();
  };

  private backgroundAt = 0;

  constructor(private platform: Platform) {
    window.addEventListener('privacy:open-settings', this.openPrivacySettingsHandler);
    this.initialize();
  }

  initialize() {
    this.platform.ready().then(() => {
      // Capacitor native app state
      App.addListener('appStateChange', (state: { isActive: boolean }) => {
        if (!state.isActive) {
          this.backgroundAt = Date.now();
        } else {
          if (this.backgroundAt) {
            const elapsed = Date.now() - this.backgroundAt;
            if (elapsed >= 10000) {
              window.dispatchEvent(new CustomEvent('app:resumedAfterDelay', { detail: { elapsed } }));
            }
            this.backgroundAt = 0;
          }
        }
      });

      // Ionic platform pause/resume events
      this.platform.pause.subscribe(() => {
        this.backgroundAt = Date.now();
      });
      this.platform.resume.subscribe(() => {
        if (this.backgroundAt) {
          const elapsed = Date.now() - this.backgroundAt;
          if (elapsed >= 10000) {
            window.dispatchEvent(new CustomEvent('app:resumedAfterDelay', { detail: { elapsed } }));
          }
          this.backgroundAt = 0;
        }
      });

      // Page Visibility API fallback (web/PWA)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.backgroundAt = Date.now();
        } else {
          if (this.backgroundAt) {
            const elapsed = Date.now() - this.backgroundAt;
            if (elapsed >= 10000) {
              window.dispatchEvent(new CustomEvent('app:resumedAfterDelay', { detail: { elapsed } }));
            }
            this.backgroundAt = 0;
          }
        }
      });
    });
  }

  allowNecessaryOnly(): void {
    this.consentService.allowNecessaryOnly();
    this.preferencesOpen.set(false);
  }

  acceptAnalytics(): void {
    this.consentService.acceptAnalytics();
    this.preferencesOpen.set(false);
  }

  openPreferences(): void {
    this.preferencesOpen.set(true);
  }

  closePreferences(): void {
    if (this.consentService.hasAnswered()) {
      this.preferencesOpen.set(false);
    }
  }
}
