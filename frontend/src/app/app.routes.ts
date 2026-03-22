import { Routes } from '@angular/router';
import { buildingSelectedGuard } from './guards/building-selected.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/building-overview/building-overview.page').then(m => m.BuildingOverviewPage)
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: 'building-overview',
    canActivate: [buildingSelectedGuard],
    loadComponent: () => import('./pages/building-overview/building-overview.page').then(m => m.BuildingOverviewPage)
  },
  {
    path: 'room-schedule/:building/:roomId',
    canActivate: [buildingSelectedGuard],
    loadComponent: () => import('./pages/room-schedule/room-schedule.page').then(m => m.RoomSchedulePage)
  },
  {
    path: 'feedback',
    loadComponent: () => import('./pages/feedback/feedback.page').then(m => m.FeedbackPage)
  },
];
