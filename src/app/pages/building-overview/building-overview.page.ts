/**
 * Building Overview Page Component
 *
 * This is the main dashboard page that displays all rooms in a selected building,
 * categorized into three sections: "Available Now", "Available Soon", and "Busy".
 *
 * Key Features:
 * - Real-time room availability with date/time override
 * - Advanced search (by room code, class name, or teacher)
 * - Floor filtering
 * - Navigation to individual room schedules
 *
 * Data Flow:
 * 1. Loads room data from BuildingService.getRoomsNow() (current snapshot)
 * 2. Loads full schedule from BuildingService.getSchedule() (for advanced search)
 * 3. Processes and categorizes rooms by status (FREE/BUSY)
 * 4. Applies filters (search, floor) and updates UI
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, RefresherEventDetail, ModalController, ToastController, PopoverController } from '@ionic/angular';
import { BuildingService } from 'src/app/services/building';
import { RouterModule, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

/**
 * Room Data Model
 *
 * Represents a room's current state at a specific point in time.
 * This interface matches the API response from /api/rooms/{building}/now
 *
 * Note: The same interface is also used for schedule slots from /api/rooms/{building}/schedule
 * when performing advanced search (fullSchedule array).
 */
interface Room {
  id: string;
  title: string;
  teacher?: string;
  room_id: string;
  building: string;
  floor: string;
  room: string;
  start: string;
  end: string;
  free_until?: string; // Time when room becomes busy (for FREE) or when current class ends (for BUSY)
  minutes_left?: number; // New API field
  next_slot_free_minutes?: number; // Duration room will be free after busy slot ends
  is_end_of_day?: boolean; // Flag for FREE rooms that are free until end of day
  status: 'FREE' | 'BUSY';
  type: 'free' | 'class';
  className?: string;
  availableSoon?: boolean; // Flag for busy rooms that will be available soon
  matchedClass?: string; // For search results: name of the matched future class
}

@Component({
  selector: 'app-building-overview',
  templateUrl: './building-overview.page.html',
  styleUrls: ['./building-overview.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule]
})
export class BuildingOverviewPage implements OnInit {
  buildingName: string = ''; // Current building code (e.g., 'AP152')

  // ========== BUILDING SELECTION ==========
  selectedBuilding: string = '';
  buildings = this.buildingService.buildings;

  // ========== DATA ARRAYS ==========
  // Main data source: current room snapshots from API
  allRooms: Room[] = [];

  // Full day schedule: used for advanced search to find rooms by future classes
  // This contains all slots (FREE and BUSY) for the entire day
  fullSchedule: Room[] = [];

  // Categorized room lists (populated by processRooms())
  freeRooms: Room[] = []; // Rooms currently available (status: 'FREE')
  busyRooms: Room[] = []; // Rooms currently occupied (status: 'BUSY')
  availableSoonRooms: Room[] = []; // Busy rooms that will be free within 30 minutes

  // Filtered results (after search/floor filters are applied)
  filteredRooms: Room[] = [];

  // ========== UI STATE ==========
  loading = true; // Loading indicator state
  error = ''; // Error message to display
  lastUpdated: Date = new Date(); // Timestamp of last successful data load

  // ========== FILTERS ==========
  searchQuery: string = ''; // Search input value (searches room code, class name, teacher)
  selectedFloor: string = 'all'; // Currently selected floor filter
  availableFloors: string[] = []; // List of floors found in current room data
  floorOptions: string[] = ['all']; // Combined array for template (includes 'all' + availableFloors)

  // ========== DATE/TIME SELECTION ==========
  // Allows users to view room availability at a specific date/time (not just "now")
  // We use a local ISO string (YYYY-MM-DDTHH:mm:ss) to ensure ion-datetime shows the correct local time
  selectedDateTimeISO: string = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, -1);

  // Legacy properties (synced with selectedDateTimeISO)
  // These are still used by the API calls and filtering logic
  selectedDate: string = this.selectedDateTimeISO.split('T')[0]; // Format: YYYY-MM-DD
  selectedTime: string = this.selectedDateTimeISO.split('T')[1].substring(0, 5); // Format: HH:mm

  // Time picker configuration
  minuteValues: number[] = [0, 10, 20, 30, 40, 50]; // 10-minute increments



  // ========== STATISTICS ==========
  // Displayed in the header stats row
  stats = {
    totalFree: 0, // Count of free rooms
    availableSoon: 0, // Count of rooms available within 30 minutes
    totalBusy: 0, // Count of busy rooms
    totalRooms: 0 // Total room count
  };

  constructor(
    public buildingService: BuildingService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

  /**
   * Helper to get local ISO string (YYYY-MM-DDTHH:mm:ss)
   * This ensures the datetime picker shows the correct local time
   */
  private getNowISO(): string {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
  }

  async ngOnInit() {
    this.selectedBuilding = this.buildingService.getSelectedBuilding();
    this.buildingName = this.selectedBuilding;

    if (!this.buildingName) {
      this.error = 'No building selected. Please go back and select a building.';
      this.loading = false;
      return;
    }
    await this.loadData();
  }

  public ionViewWillEnter() {
    const serviceBuilding = this.buildingService.getSelectedBuilding();
    if (serviceBuilding && serviceBuilding !== this.selectedBuilding) {
      this.selectedBuilding = serviceBuilding;
      this.onBuildingChange();
    }
  }

  onBuildingChange() {
    if (this.selectedBuilding) {
      this.buildingName = this.selectedBuilding;
      this.buildingService.setSelectedBuilding(this.selectedBuilding);
      this.loadData();
    }
  }

  /**
   * Main data loading method
   *
   * Fetches room data from two API endpoints:
   * 1. getRoomsNow() - Current room snapshots (what's free/busy right now)
   * 2. getSchedule() - Full day schedule (for advanced search functionality)
   *
   * @param event - Optional refresher event (for pull-to-refresh)
   */
  async loadData(event?: CustomEvent<RefresherEventDetail>) {
    this.error = '';
    if (!event) this.loading = true;

    try {
      // Format time as HH:mm:ss for backend API
      const timeParam = `${this.selectedTime}:00`;

      // Fetch both "now" view and full schedule in parallel for better performance
      const [nowResponse, scheduleResponse] = await Promise.all([
        this.buildingService.getRoomsNow(this.buildingName, this.selectedDate, timeParam),
        this.buildingService.getSchedule(this.buildingName, this.selectedDate)
      ]);

      // Store raw API responses
      this.allRooms = nowResponse.data || [];
      this.fullSchedule = scheduleResponse.data || [];

      // Process and categorize rooms using selected date/time
      // This populates freeRooms, busyRooms, and availableSoonRooms
      this.processRooms();

      // Update header statistics
      this.updateStats();

      // Extract unique floor values from room data for filter buttons
      this.extractFloors();

      // Apply current search and floor filters
      this.applyFilters();

      this.lastUpdated = new Date();

    } catch (e: any) {
      console.error('Error loading data:', e);
      if (e instanceof HttpErrorResponse) {
        this.error = `Server Error: ${e.status} - ${e.statusText}`;
      } else {
        this.error = 'Connection failed. Please check your internet connection.';
      }

      const toast = await this.toastCtrl.create({
        message: this.error,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
    } finally {
      this.loading = false;
      if (event) event.detail.complete();
    }
  }

  /**
   * Process and categorize rooms into sections
   *
   * This method:
   * 1. Separates rooms by status (FREE vs BUSY)
   * 2. Identifies "Available Soon" rooms (busy but free within 30 min)
   * 3. Marks busy rooms with "availableSoon" flag (for yellow badge)
   * 4. Sorts rooms appropriately for each section
   *
   * Note: Uses selectedDate/selectedTime (not current time) to allow time travel
   */
  private processRooms() {
    // Create query datetime from user-selected date/time (allows viewing past/future)
    const queryDateTime = new Date(`${this.selectedDate}T${this.selectedTime}:00`);

    // ========== CATEGORIZE BY STATUS ==========
    // Split rooms into FREE and BUSY arrays
    this.freeRooms = this.allRooms.filter((r: Room) => r.status === 'FREE');
    this.busyRooms = this.allRooms.filter((r: Room) => r.status === 'BUSY');

    // ========== IDENTIFY "AVAILABLE SOON" ROOMS ==========
    // These are busy rooms that will be free within 30 minutes
    // They get their own section with yellow/orange styling
    this.availableSoonRooms = this.busyRooms.filter((room: Room) => {
      const endTime = new Date(room.end);
      const diffMs = endTime.getTime() - queryDateTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins > 0 && diffMins <= 30; // Free within 30 minutes
    });

    // Remove "Available Soon" rooms from busy list (they have their own section)
    this.busyRooms = this.busyRooms.filter((room: Room) => {
      return !this.availableSoonRooms.some(soon => soon.id === room.id);
    });

    // ========== MARK BUSY ROOMS WITH "AVAILABLE SOON" FLAG ==========
    // Some busy rooms stay in the "Busy" section but get a yellow "Available Soon" badge
    // Criteria: Free within 15 minutes AND will be free for more than 15 minutes
    // This is different from availableSoonRooms (which get their own section)
    this.busyRooms.forEach((room: Room) => {
      const endTime = new Date(room.end);
      const diffMs = endTime.getTime() - queryDateTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const nextFreeMinutes = room.next_slot_free_minutes || 0;

      // Available within 15 minutes AND free for more than 15 minutes
      room.availableSoon = diffMins > 0 && diffMins <= 15 && nextFreeMinutes > 15;
    });

    // ========== SORTING ==========
    // Sort free rooms: most available first, then by floor (EG = 0), then by room number
    // This ensures the best rooms appear at the top
    this.freeRooms.sort((a, b) => {
      // First: by minutes_left (longest first)
      const timeDiff = (b.minutes_left || 0) - (a.minutes_left || 0);
      if (timeDiff !== 0) return timeDiff;

      // Second: by floor (EG = 0, then numeric floors)
      const floorA = a.floor === 'EG' ? '0' : a.floor;
      const floorB = b.floor === 'EG' ? '0' : b.floor;
      const floorDiff = floorA.localeCompare(floorB, undefined, { numeric: true });
      if (floorDiff !== 0) return floorDiff;

      // Third: by room number (numeric)
      const roomA = parseInt(a.room) || 0;
      const roomB = parseInt(b.room) || 0;
      return roomA - roomB;
    });

    // Sort available soon by time until free (soonest first)
    this.availableSoonRooms.sort((a, b) => {
      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();
      return aEnd - bEnd;
    });

    // Sort busy rooms by when they become free (soonest first)
    this.busyRooms.sort((a, b) => {
      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();
      return aEnd - bEnd;
    });
  }

  private updateStats() {
    this.stats.totalFree = this.freeRooms.length;
    this.stats.availableSoon = this.availableSoonRooms.length;
    this.stats.totalBusy = this.busyRooms.length;
    this.stats.totalRooms = this.allRooms.length;
  }

  private extractFloors() {
    const floors = new Set<string>();
    this.allRooms.forEach(room => {
      if (room.floor) {
        floors.add(room.floor);
      }
    });
    this.availableFloors = Array.from(floors).sort((a, b) => {
      // Sort: Ground floor first, then numeric floors
      if (a === 'EG' || a === 'Ground') return -1;
      if (b === 'EG' || b === 'Ground') return 1;
      return a.localeCompare(b);
    });
    // Update combined array for template
    this.floorOptions = ['all', ...this.availableFloors];
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFloorChange() {
    this.applyFilters();
  }

  /**
   * Apply search and floor filters to room data
   *
   * This method:
   * 1. Filters by floor (if selected)
   * 2. Performs advanced search on fullSchedule (can find rooms by future classes)
   * 3. Re-categorizes filtered results
   * 4. Updates stats
   *
   * Advanced Search: Searches not just current room state, but also:
   * - Room codes/numbers
   * - Class names (even if not currently active)
   * - Teacher names (even if not currently teaching)
   */
  private applyFilters() {
    // Start with all rooms (will be filtered down)
    let filtered = [...this.allRooms];

    // ========== FLOOR FILTER ==========
    if (this.selectedFloor !== 'all') {
      filtered = filtered.filter(room => room.floor === this.selectedFloor);
    }

    // ========== ADVANCED SEARCH ==========
    // This searches the FULL schedule (not just current state)
    // This allows finding rooms by future classes or teachers
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();

      // Track which rooms match the search query
      const matchingRoomIds = new Set<string>();
      // Store match descriptions (e.g., "Matches: Database Systems")
      const matchedClasses = new Map<string, string>();

      // Search through full day schedule (all slots, not just current)
      this.fullSchedule.forEach(slot => {
        // Match against room code (e.g., "AP152-EG-01")
        if (slot.room_id.toLowerCase().includes(query) || slot.room.toLowerCase().includes(query)) {
          matchingRoomIds.add(slot.room_id);
        }
        // Match against class title (e.g., "Database Systems")
        else if (slot.title && slot.title.toLowerCase().includes(query)) {
          matchingRoomIds.add(slot.room_id);
          // Store match description for display (shows why room matched)
          matchedClasses.set(slot.room_id, `Matches: ${slot.title}`);
        }
        // Match against teacher name
        else if (slot.teacher && slot.teacher.toLowerCase().includes(query)) {
          matchingRoomIds.add(slot.room_id);
          matchedClasses.set(slot.room_id, `Matches: ${slot.teacher}`);
        }
      });

      // Filter current rooms to only show those that matched in the full schedule
      filtered = filtered.filter(room => matchingRoomIds.has(room.room_id));

      // Attach match descriptions to rooms (for display in UI)
      filtered.forEach(room => {
        if (matchedClasses.has(room.room_id)) {
          // If the current room title/teacher doesn't already match the query, show why it matched
          const titleMatch = room.title && room.title.toLowerCase().includes(query);
          const teacherMatch = room.teacher && room.teacher.toLowerCase().includes(query);
          const idMatch = room.room_id.toLowerCase().includes(query) || room.room.toLowerCase().includes(query);

          // Only show match description if current room doesn't already match
          // (to avoid redundant information)
          if (!titleMatch && !teacherMatch && !idMatch) {
            room.matchedClass = matchedClasses.get(room.room_id);
          } else {
            room.matchedClass = undefined;
          }
        }
      });
    } else {
      // Clear match info when search is cleared
      filtered.forEach(room => room.matchedClass = undefined);
    }

    // ========== RE-CATEGORIZE FILTERED RESULTS ==========
    // After filtering, re-split into FREE/BUSY/AVAILABLE SOON
    this.filteredRooms = filtered;
    const free = filtered.filter(r => r.status === 'FREE');
    const busy = filtered.filter(r => r.status === 'BUSY');

    // Process available soon from filtered busy rooms
    const queryDateTime = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
    this.availableSoonRooms = busy.filter((room: Room) => {
      const endTime = new Date(room.end);
      const diffMs = endTime.getTime() - queryDateTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins > 0 && diffMins <= 30;
    });

    this.busyRooms = busy.filter((room: Room) => {
      return !this.availableSoonRooms.some(soon => soon.id === room.id);
    });

    this.freeRooms = free;

    // Re-sort: most available first, then by floor (EG = 0), then by room number
    this.freeRooms.sort((a, b) => {
      // First: by minutes_left (longest first)
      const timeDiff = (b.minutes_left || 0) - (a.minutes_left || 0);
      if (timeDiff !== 0) return timeDiff;

      // Second: by floor (EG = 0, then numeric floors)
      const floorA = a.floor === 'EG' ? '0' : a.floor;
      const floorB = b.floor === 'EG' ? '0' : b.floor;
      const floorDiff = floorA.localeCompare(floorB, undefined, { numeric: true });
      if (floorDiff !== 0) return floorDiff;

      // Third: by room number (numeric)
      const roomA = parseInt(a.room) || 0;
      const roomB = parseInt(b.room) || 0;
      return roomA - roomB;
    });
    this.availableSoonRooms.sort((a, b) => {
      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();
      return aEnd - bEnd;
    });
    this.busyRooms.sort((a, b) => {
      const aEnd = new Date(a.end).getTime();
      const bEnd = new Date(b.end).getTime();
      return aEnd - bEnd;
    });

    // Update stats
    this.updateStats();
  }

  // ========== FORMATTING HELPERS ==========

  formatRoomIdWithBreaks(roomId: string): string {
    // Insert word break opportunities after each period
    return roomId.replace(/\./g, '.<wbr>');
  }

  getFloorLabel(floor: string): string {
    if (floor === 'EG' || floor === 'Ground') return 'Ground Floor';
    return `Floor ${floor}`;
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatFreeUntil(room: Room): string {
    if (room.free_until) {
      // free_until is already in HH:mm format from backend
      return room.free_until;
    }
    // Fallback to formatting the end time
    return this.formatTime(room.end);
  }

  isAfter1815(): boolean {
    // Check if current selected time is after 18:15
    const [hours, minutes] = this.selectedTime.split(':').map(Number);
    return hours > 18 || (hours === 18 && minutes >= 15);
  }

  isAfterHours(): boolean {
    // Check if current selected time is after 18:15 or before 08:00 (evening/night period)
    const [hours, minutes] = this.selectedTime.split(':').map(Number);
    const currentTime = hours * 60 + minutes;
    const endTime = 18 * 60 + 15; // 18:15
    const startTime = 8 * 60; // 08:00
    return currentTime >= endTime || currentTime < startTime;
  }



  getTimeUntil(endTime: string): string {
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Now';
    if (diffMins < 60) return `${diffMins}m left`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }



  onDateTimeChange(event: any) {
    if (event.detail.value) {
      this.selectedDateTimeISO = event.detail.value;
      if (typeof this.selectedDateTimeISO === 'string') {
        this.selectedDate = this.selectedDateTimeISO.split('T')[0];
        this.selectedTime = this.selectedDateTimeISO.split('T')[1].substring(0, 5);
        this.loadData();
      }
    }
  }

  resetToNow() {
    this.selectedDateTimeISO = this.getNowISO();
    // We update the local model immediately so the picker reflects "Now".
    // The user must still click "Apply" to confirm this selection.
  }

  getFormattedDateTime(): string {
    if (!this.selectedDateTimeISO) return '';
    const date = new Date(this.selectedDateTimeISO);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} | ${hours}:${minutes}`;
  }

  isNowSelected(): boolean {
    const now = new Date();
    const selectedDateTime = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
    const diff = Math.abs(now.getTime() - selectedDateTime.getTime());
    return diff < 60000; // Within 1 minute
  }

  getTimeUntilFree(endTime: string): string {
    const end = new Date(endTime);
    const queryDateTime = new Date(`${this.selectedDate}T${this.selectedTime}:00`);
    const diffMs = end.getTime() - queryDateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Now';
    if (diffMins < 60) return `${diffMins} min`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedFloor = 'all';
    this.applyFilters();
  }

  goBack() {
    this.router.navigate(['/home']);
  }


  /**
   * Navigate to room schedule detail page
   *
   * Opens the individual room schedule page showing the full timeline for a specific room.
   * Passes the selected date as a query parameter to maintain date context.
   *
   * @param room - The room object to view schedule for
   */
  openRoomDetail(room: Room) {
    // Pass the selected date to the room schedule page (maintains date context)
    this.router.navigate(['/room-schedule', this.buildingName, room.room_id], {
      queryParams: {
        date: this.selectedDate
      }
    });
  }
}
