/**
 * Onboarding Page Component
 *
 * First-time user experience: allows users to select their building
 * and initialize the building data in the backend.
 *
 * Key Features:
 * - Building selection dropdown (populated from BuildingService.buildings)
 * - Initializes building data via API (creates tables, fetches schedule)
 * - Stores raw API response in sessionStorage for debugging
 * - Navigates to building overview after successful initialization
 *
 * Data Flow:
 * 1. User selects building from dropdown
 * 2. Calls BuildingService.initializeBuilding() (POST /api/buildings/initialize)
 * 3. Backend creates tables and fetches initial data if needed
 * 4. On success: stores building code, saves raw data, navigates to overview
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
// Service import: BuildingService provides building list and API methods
import { BuildingService } from 'src/app/services/building';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OnboardingPage {
  // ========== BUILDING SELECTION ==========
  selectedBuilding: string = ''; // Selected building code (e.g., 'AP152')
  buildings = this.buildingService.buildings; // List of available buildings (from service)

  // ========== UI STATE ==========
  loading: boolean = false; // Loading indicator during initialization

  // ========== STORAGE ==========
  // Key for storing raw API response in sessionStorage (for debugging)
  private RAW_DATA_KEY = 'building_raw_data';

  constructor(
    private buildingService: BuildingService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  /**
   * Initialize building and navigate to overview
   *
   * This method:
   * 1. Calls the backend API to initialize the building (create tables, fetch data)
   * 2. Stores the raw API response in sessionStorage (for debugging)
   * 3. Sets the selected building in BuildingService
   * 4. Navigates to the building overview page
   *
   * API Endpoint: POST /api/buildings/initialize
   */
  async onNext() {
    if (!this.selectedBuilding || this.loading) return;

    this.loading = true;
    // Show loading overlay
    const loading = await this.loadingCtrl.create({
      message: `Syncing ${this.selectedBuilding} with University API...`,
      duration: 0
    });
    await loading.present();

    try {
      // Call backend to initialize building (creates tables, fetches schedule if needed)
      const response = await this.buildingService.initializeBuilding(this.selectedBuilding);

      await loading.dismiss();
      this.loading = false;

      // Store raw API response in sessionStorage (for debugging/inspection)
      sessionStorage.setItem(this.RAW_DATA_KEY, JSON.stringify(response.raw_content, null, 2));

      // Show success toast
      const toast = await this.toastCtrl.create({
        message: `Successfully synced ${this.selectedBuilding}!`,
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Small delay for UX
      setTimeout(() => {
      this.router.navigate(['/building-overview']);
      }, 500);

    } catch (error: any) {
      await loading.dismiss();
      this.loading = false;
      console.error(error);

      const toast = await this.toastCtrl.create({
        message: error.error?.message || 'Sync failed. Please check your connection and try again.',
        duration: 4000,
        color: 'danger',
        position: 'top',
        buttons: [
          {
            text: 'Retry',
            handler: () => this.onNext()
          }
        ]
      });
      toast.present();
    }
  }

  protected selectBuilding(buildingCode: string) {
    this.buildingService.setSelectedBuilding(buildingCode);
  }

}
