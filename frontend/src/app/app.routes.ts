import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: '',
    loadComponent: () => import('./pages/startup/startup.page').then(m => m.StartupPage)
  },
  {
    path: 'building-overview',
    loadComponent: () => import('./pages/building-overview/building-overview.page').then( m => m.BuildingOverviewPage)
  },
  {
    path: 'room-schedule/:building/:roomId',
    loadComponent: () => import('./pages/room-schedule/room-schedule.page').then( m => m.RoomSchedulePage)
  },
];
