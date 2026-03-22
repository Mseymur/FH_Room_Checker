import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BuildingService } from '../services/building';

export const buildingSelectedGuard = () => {
  const buildingService = inject(BuildingService);
  const router = inject(Router);

  if (buildingService.getSelectedBuilding()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
