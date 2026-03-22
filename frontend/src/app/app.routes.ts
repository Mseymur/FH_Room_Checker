import { Routes } from '@angular/router';
import { buildingSelectedGuard } from './guards/building-selected.guard';

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
    canActivate: [buildingSelectedGuard],
    loadComponent: () => import('./pages/building-overview/building-overview.page').then( m => m.BuildingOverviewPage)
  },
  {
    path: 'room-schedule/:building/:roomId',
    canActivate: [buildingSelectedGuard],
    loadComponent: () => import('./pages/room-schedule/room-schedule.page').then( m => m.RoomSchedulePage)
  },
  {
    path: 'feedback',
    canActivate: [buildingSelectedGuard],
    loadComponent: () => import('./pages/feedback/feedback.page').then( m => m.FeedbackPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
