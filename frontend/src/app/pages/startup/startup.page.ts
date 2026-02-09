import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BuildingService } from 'src/app/services/building';
import { IonSpinner, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-startup',
  template: `
    <ion-content class="ion-padding" fullscreen>
      <div style="height:100%; display:flex; align-items:center; justify-content:center;">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonContent, IonSpinner]
})
export class StartupPage implements OnInit {
  constructor(private buildingService: BuildingService, private router: Router) {}

  ngOnInit(): void {
    const selected = this.buildingService.getSelectedBuilding();
    if (selected && selected.length > 0) {
      // Navigate straight to building overview
      this.router.navigate(['/building-overview']);
    } else {
      // No building yet — show onboarding
      this.router.navigate(['/home']);
    }
  }
}
