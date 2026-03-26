/**
 * Onboarding Page Component
 *
 * First-time user experience: allows users to select their building.
 *
 * Key Features:
 * - Building selection dropdown (populated from BuildingService.buildings)
 * - Stores the selected building locally
 * - Navigates to building overview
 *
 * Data Flow:
 * 1. User selects building from dropdown
 * 2. App stores the selected building code locally
 * 3. App navigates to the building overview page
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController, IonContent, IonIcon, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, searchOutline, timeOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
// Service import: BuildingService provides building list and API methods
import { BuildingService } from 'src/app/services/building';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSelect, IonSelectOption, IonSpinner]
})
export class WelcomePage {
  // ========== BUILDING SELECTION ==========
  selectedBuilding: string = ''; // Selected building code (e.g., 'AP152')
  buildings = this.buildingService.buildings; // List of available buildings (from service)

  // ========== UI STATE ==========
  loading: boolean = false; // Loading indicator during initialization

  constructor(
    private buildingService: BuildingService,
    private navCtrl: NavController,
  ) {
    addIcons({ informationCircleOutline, searchOutline, timeOutline, chatbubbleEllipsesOutline });
  }

  /**
   * Save the selected building and navigate to the overview
   *
   * This method:
   * 1. Stores the selected building in BuildingService
   * 2. Navigates to the building overview page
   */
  async onNext() {
    if (!this.selectedBuilding || this.loading) return;

    this.loading = true;

    this.buildingService.setSelectedBuilding(this.selectedBuilding);

    // Small delay for UX
    setTimeout(() => {
      this.loading = false;
      this.navCtrl.navigateRoot('/', { replaceUrl: true });
    }, 300);
  }

  protected selectBuilding(buildingCode: string) {
    this.buildingService.setSelectedBuilding(buildingCode);
  }

  goToFeedback() {
    this.navCtrl.navigateForward('/feedback');
  }
}
