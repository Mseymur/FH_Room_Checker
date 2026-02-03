import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
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
