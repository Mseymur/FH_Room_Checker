import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

import { environment } from 'src/environments/environment';

import { ConsentService } from './consent.service';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: string]: unknown;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  readonly analyticsLoaded = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly consentService = inject(ConsentService);

  private googleAnalyticsLoaded = false;
  private speedInsightsLoaded = false;

  constructor() {
    effect(() => {
      if (!environment.production) {
        return;
      }

      if (this.consentService.analyticsAllowed()) {
        void this.enableAnalytics();
        return;
      }

      this.disableGoogleAnalytics();
      this.analyticsLoaded.set(false);
    });
  }

  private async enableAnalytics(): Promise<void> {
    this.enableGoogleAnalytics();
    await this.enableSpeedInsights();

    this.analyticsLoaded.set(this.googleAnalyticsLoaded || this.speedInsightsLoaded);
  }

  private enableGoogleAnalytics(): void {
    const measurementId = environment.firebaseConfig.measurementId;
    if (!measurementId || this.googleAnalyticsLoaded || typeof window === 'undefined') {
      return;
    }

    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function (...args: unknown[]) {
      window.dataLayer.push(args);
    };

    if (!this.document.getElementById('fh-room-checker-ga')) {
      const script = this.document.createElement('script');
      script.id = 'fh-room-checker-ga';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      this.document.head.appendChild(script);
    }

    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
    });

    this.googleAnalyticsLoaded = true;
  }

  private async enableSpeedInsights(): Promise<void> {
    if (this.speedInsightsLoaded) {
      return;
    }

    const { injectSpeedInsights } = await import('@vercel/speed-insights');
    injectSpeedInsights();
    this.speedInsightsLoaded = true;
  }

  private disableGoogleAnalytics(): void {
    const measurementId = environment.firebaseConfig.measurementId;
    if (!measurementId || typeof window === 'undefined') {
      return;
    }

    window[`ga-disable-${measurementId}`] = true;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }
}
