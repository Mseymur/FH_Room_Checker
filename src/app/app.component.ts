import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private backgroundAt = 0;

  constructor(private platform: Platform) {
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
}
