import { Routes } from '@angular/router';
import { buildingSelectedGuard } from './guards/building-selected.guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then( m => m.WelcomePage)
  },
  {
    path: '',
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
