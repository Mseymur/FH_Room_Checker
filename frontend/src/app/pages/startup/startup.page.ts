import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavController, IonSpinner, IonContent } from '@ionic/angular/standalone';
import { BuildingService } from 'src/app/services/building';

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
export class StartupPage {
  constructor(private buildingService: BuildingService, private navCtrl: NavController) {}

  ionViewWillEnter(): void {
    const selected = this.buildingService.getSelectedBuilding();
    if (selected && selected.length > 0) {
      this.navCtrl.navigateRoot('/building-overview', { replaceUrl: true });
    } else {
      this.navCtrl.navigateRoot('/home', { replaceUrl: true });
    }
  }
}
