import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, locationOutline, mailOutline, calendarOutline, personCircleOutline, chevronBack, chevronForward } from 'ionicons/icons';
import { BuildingService } from 'src/app/services/building';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-teacher-schedule-modal',
  templateUrl: './teacher-schedule.modal.html',
  styleUrls: ['./teacher-schedule.modal.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent]
})
export class TeacherScheduleModalComponent implements OnInit {
  @Input() teacherName!: string;
  @Input() currentBuilding!: string;

  selectedDate: Date = new Date();
  dateLabel: string = 'Today';

  displaySchedules: any[] = [];
  loading = false;

  constructor(private modalCtrl: ModalController, private buildingService: BuildingService) {
    addIcons({ closeOutline, locationOutline, mailOutline, calendarOutline, personCircleOutline, chevronBack, chevronForward });
  }

  ngOnInit() {
    this.loadGlobalSchedule();
  }

  previousDay() {
    this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    this.loadGlobalSchedule();
  }

  nextDay() {
    this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    this.loadGlobalSchedule();
  }

  updateDateLabel() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (this.selectedDate.toDateString() === today.toDateString()) {
      this.dateLabel = 'Today';
    } else if (this.selectedDate.toDateString() === tomorrow.toDateString()) {
      this.dateLabel = 'Tomorrow';
    } else if (this.selectedDate.toDateString() === yesterday.toDateString()) {
      this.dateLabel = 'Yesterday';
    } else {
      this.dateLabel = this.selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  async loadGlobalSchedule() {
    this.loading = true;
    this.displaySchedules = [];
    this.updateDateLabel();

    try {
      const tzOffset = this.selectedDate.getTimezoneOffset() * 60000;
      const localISODate = (new Date(this.selectedDate.getTime() - tzOffset)).toISOString().split('T')[0];
      
      const allBuildings = this.buildingService.buildings;
      const promises = allBuildings.map(b => this.buildingService.getSchedule(b.code, localISODate).catch((): any => null));
      const responses = await Promise.all(promises);

      let globalSchedules: any[] = [];
      responses.forEach(res => {
        if (res && res.data) {
          globalSchedules.push(...res.data);
        }
      });

      this.displaySchedules = globalSchedules
        .filter(s => s.teacher && s.teacher.trim() === this.teacherName)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        
    } catch (e) {
      console.error('Failed to load global schedule', e);
    } finally {
      this.loading = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  openRoomSchedule(roomId: string, buildingCode: string) {
    this.modalCtrl.dismiss({ navigateToRoom: roomId, building: buildingCode });
  }
}
