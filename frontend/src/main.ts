import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { injectSpeedInsights } from '@vercel/speed-insights';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { HttpClientModule } from '@angular/common/http'; // <--- IMPORT THIS

import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { initializeAppCheck, ReCaptchaV3Provider, provideAppCheck } from "@angular/fire/app-check";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule), // <--- ADD THIS LINE
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAppCheck(() => initializeAppCheck(undefined, {
      provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    })),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
});

// Initialize Vercel Speed Insights
injectSpeedInsights();