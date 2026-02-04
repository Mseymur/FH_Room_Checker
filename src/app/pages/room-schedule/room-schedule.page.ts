/**
 * Room Schedule Page Component
 * 
 * Displays a detailed timeline view for a specific room, showing all time slots
 * (FREE and BUSY) for the selected date.
 * 
 * Key Features:
 * - Timeline view with time slots from 08:00 to 18:15
 * - Date navigation (previous/next day, jump to today)
 * - "Now" indicator for current time slot
 * - After-hours notice when viewing outside working hours
 * 
 * Data Flow:
 * 1. Receives building code and room ID from route parameters
 * 2. Receives optional date from query parameters (from building overview)
 * 3. Loads full schedule from BuildingService.getSchedule()
 * 4. Filters slots for the specific room and time range (08:00-18:15)
 * 5. Displays slots in chronological order
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavController, IonHeader, IonContent, IonIcon, IonSpinner, IonModal, IonDatetime, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BuildingService } from 'src/app/services/building';
import { addIcons } from 'ionicons';
import { arrowBack, calendarOutline, chevronBack, chevronForward, alertCircle, checkmarkCircle, timeOutline, informationCircleOutline } from 'ionicons/icons';

/**
 * Room Slot Data Model
 * 
 * Represents a single time slot in a room's schedule.
 * This interface matches the API response from /api/rooms/{building}/schedule
 * 
 * Note: Slots that extend past 18:15 are truncated but marked with extendsPast1815 flag
 */
interface RoomSlot {
  id: string;
  title: string;
  teacher?: string;
  start: string;
  end: string;
  status: 'FREE' | 'BUSY';
  className?: string;
  room_id: string;
  extendsPast1815?: boolean; // Flag for slots that extend past 18:15
  originalEnd?: string; // Original end time before truncation
}

@Component({
  selector: 'app-room-schedule',
  templateUrl: './room-schedule.page.html',
  styleUrls: ['./room-schedule.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IonHeader, IonContent, IonIcon, IonSpinner, IonModal, IonDatetime, IonButton]
})
export class RoomSchedulePage implements OnInit {
  @ViewChild('datetimeModal') datetimeModal!: IonModal;

  // ========== ROUTE PARAMETERS ==========
  buildingCode = ''; // Building code from route (e.g., 'AP152')
  roomId = ''; // Room ID from route (e.g., 'AP152-EG-01')

  // ========== DATE/TIME SELECTION ==========
  // ========== DATE/TIME SELECTION ==========
  selectedDate: string = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  tempDateISO: string = new Date().toISOString(); // Temporary value for the picker (Full ISO)

  // Property for the ion-datetime model
  get selectedDateISO(): string {
    return this.selectedDate.includes('T') ? this.selectedDate : `${this.selectedDate}T${new Date().toISOString().split('T')[1]}`;
  }

  set selectedDateISO(value: string) {
    this.selectedDate = value.split('T')[0];
  }

  // ========== DATA ==========
  slots: RoomSlot[] = []; // All time slots for the selected room and date

  // ========== UI STATE ==========
  loading = true; // Loading indicator
  error = ''; // Error message
  nextEventText = ''; // Text showing next upcoming event (e.g., "Free in 15 min")

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private buildingService: BuildingService
  ) {
    addIcons({ arrowBack, calendarOutline, chevronBack, chevronForward, alertCircle, checkmarkCircle, timeOutline, informationCircleOutline });
  }

  /**
   * Component initialization
   * 
   * Reads route parameters (building code, room ID) and optional query parameters (date).
   * The date can be passed from the building overview page to maintain context.
   */
  ngOnInit() {
    // Subscribe to route parameters (building code and room ID)
    this.route.paramMap.subscribe(params => {
      this.buildingCode = params.get('building') ?? '';
      this.roomId = params.get('roomId') ?? '';

      // Check if date was passed from building overview (maintains date context)
      this.route.queryParamMap.subscribe(queryParams => {
        const passedDate = queryParams.get('date');
        if (passedDate) {
          this.selectedDate = passedDate;
        } else {
          // Default to today if no date provided
          this.selectedDate = new Date().toISOString().split('T')[0];
        }
        this.loadSchedule();
      });
    });
  }

  /**
   * Load schedule data for the selected room and date
   * 
   * Fetches all slots for the building/date, then:
   * 1. Filters to the specific room
   * 2. Truncates slots to working hours (08:00-18:15)
   * 3. Marks slots that extend past 18:15
   * 4. Sorts chronologically
   */
  async loadSchedule() {
    if (!this.buildingCode || !this.roomId) {
      this.error = 'Missing room information.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    const dateParam = this.selectedDate;

    try {
      // Fetch full schedule for the building and date
      const response = await this.buildingService.getSchedule(this.buildingCode, dateParam);
      const allSlots: RoomSlot[] = response?.data || [];

      // Define working hours boundaries (08:00 to 18:15)
      const dayStart = new Date(`${dateParam}T08:00:00`);
      const dayEnd = new Date(`${dateParam}T18:15:00`);

      // Process slots: filter by room, truncate to working hours, sort
      this.slots = allSlots
        .filter(slot => slot.room_id === this.roomId) // Only slots for this room
        .map(slot => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          const modifiedSlot = { ...slot };

          // Truncate slot start to 08:00 if it begins earlier
          if (slotStart < dayStart) {
            modifiedSlot.start = dayStart.toISOString();
          }

          // Truncate slot end to 18:15 if it extends later
          // Mark with flag so UI can show "Free until end of day" instead of "18:15"
          if (slotEnd > dayEnd) {
            modifiedSlot.end = dayEnd.toISOString();
            // Flag for UI: this slot extends past working hours
            (modifiedSlot as any).extendsPast1815 = true;
            // Store original end time (for reference, not displayed)
            (modifiedSlot as any).originalEnd = slotEnd.toISOString();
          }

          return modifiedSlot;
        })
        .filter(slot => {
          // Only include slots that overlap with working hours (08:00-18:15)
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return slotStart < dayEnd && slotEnd > dayStart;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()); // Chronological order

      this.updateNextEventText();
    } catch (e: any) {
      this.error = e?.message || 'Unable to load schedule.';
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.navCtrl.navigateBack(['/building-overview']);
  }

  previousDay() {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.selectedDate = date.toISOString().split('T')[0];
    this.loadSchedule();
  }

  nextDay() {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.selectedDate = date.toISOString().split('T')[0];
    this.loadSchedule();
  }

  goToToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadSchedule();
  }

  onDateTimeChange(event: any) {
    if (event.detail.value) {
      // Update tempDateISO with the new value
      this.tempDateISO = event.detail.value;
      if (typeof this.tempDateISO === 'string') {
        // Extract the date part and reload
        this.selectedDate = this.tempDateISO.split('T')[0];
        this.loadSchedule();
      }
    }
  }

  openDatePicker() {
    // Initialize with full ISO string to avoid state issues
    // Using current time ensures we have a valid ISO string
    const now = new Date();
    // If selectedDate is already set, construct ISO from it
    if (this.selectedDate) {
      this.tempDateISO = `${this.selectedDate}T${now.toISOString().split('T')[1]}`;
    } else {
      this.tempDateISO = now.toISOString();
    }
    this.datetimeModal.present();
  }

  resetToNow() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    this.selectedDate = today;
    this.tempDateISO = now.toISOString();
    this.loadSchedule();
  }

  get isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return today === this.selectedDate;
  }

  formatDateLabel(): string {
    const date = new Date(this.selectedDate);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  getCurrentTimeLabel(): string {
    const date = new Date(this.selectedDate);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  formatTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  getSlotEndTime(slot: RoomSlot): string {
    // If slot extends past 18:15, show 18:15 instead of the truncated time
    if (slot.extendsPast1815) {
      const dateStr = this.selectedDate;
      const end1815 = new Date(`${dateStr}T18:15:00`);
      return this.formatTime(end1815.toISOString());
    }
    return this.formatTime(slot.end);
  }

  formatDuration(slot: RoomSlot): string {
    const start = new Date(slot.start);
    const end = new Date(slot.end);

    // Cap the end time at 18:15 for duration calculation
    const dateStr = this.selectedDate;
    const maxEnd = new Date(`${dateStr}T18:15:00`);
    const effectiveEnd = end > maxEnd ? maxEnd : end;

    const diffMins = Math.floor((effectiveEnd.getTime() - start.getTime()) / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  getFreeSlotText(slot: RoomSlot): string {
    // If slot extends past 18:15, show "Free until end of day"
    if (slot.extendsPast1815 && slot.status === 'FREE') {
      return 'Free until end of day';
    }
    // Otherwise show duration (already capped at 18:15)
    return `Free for ${this.formatDuration(slot)}`;
  }

  isAfterHours(): boolean {
    // Check if current time is after 18:15 or before 08:00 (evening/night period)
    if (!this.isToday) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    const endTime = 18 * 60 + 15; // 18:15
    const startTime = 8 * 60; // 08:00
    return currentTime >= endTime || currentTime < startTime;
  }

  isCurrentSlot(slot: RoomSlot): boolean {
    if (!this.isToday) return false;
    const now = new Date();
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return now >= start && now <= end;
  }

  isPastSlot(slot: RoomSlot): boolean {
    if (!this.isToday) return false;
    const now = new Date();
    const end = new Date(slot.end);
    return now > end;
  }

  isFutureSlot(slot: RoomSlot): boolean {
    const now = new Date();
    const start = new Date(slot.start);
    return start > now;
  }

  updateNextEventText() {
    if (!this.slots.length) {
      this.nextEventText = '';
      return;
    }

    const now = new Date();
    const upcoming = this.slots.find(slot => new Date(slot.start) > now);

    if (!upcoming) {
      this.nextEventText = '';
      return;
    }

    const start = new Date(upcoming.start);
    const diffMins = Math.floor((start.getTime() - now.getTime()) / 60000);
    const label = upcoming.status === 'FREE' ? 'Free' : (upcoming.title || 'Busy');

    if (diffMins <= 0) {
      this.nextEventText = `${label} now`;
    } else if (diffMins < 60) {
      this.nextEventText = `${label} in ${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      this.nextEventText = mins > 0 ? `${label} in ${hours}h ${mins}m` : `${label} in ${hours}h`;
    }
  }
}
