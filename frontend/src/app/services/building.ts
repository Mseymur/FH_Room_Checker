/**
 * Building Service
 *
 * Central service for all building-related API calls and data management.
 *
 * Responsibilities:
 * - Maintains list of available buildings
 * - Manages selected building state
 * - Provides methods for all building/room API endpoints
 *
 * API Endpoints Used:
 * - POST /api/buildings/initialize - Initialize building (onboarding)
 * - GET /api/rooms/{building}/now - Get current room snapshots
 * - GET /api/rooms/{building}/schedule - Get full day schedule
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildingService {

  // ========== BUILDING LIST ==========
  // Complete list of university buildings supported by the system
  // Used by onboarding page for building selection dropdown
  public readonly buildings = [
    { code: 'AP152', label: 'Alte Poststraße 152' },
    { code: 'AP147', label: 'Alte Poststraße 147' },
    { code: 'AP149', label: 'Alte Poststraße 149' },
    { code: 'AP154', label: 'Alte Poststraße 154' },
    { code: 'EA11', label: 'Eggenberger Allee 11' },
    { code: 'EA9', label: 'Eggenberger Allee 9' },
    { code: 'EA13', label: 'Eggenberger Allee 13' },
    { code: 'ES30i', label: 'Eggenberger Straße 30i' },
    { code: 'ES7a', label: 'Eggenberger Straße 7a' },
    { code: 'ES7b', label: 'Eggenberger Straße 7b' },
  ];

  // ========== SELECTED BUILDING STATE ==========
  // Stores the currently selected building code (persists across navigation)
  private selectedBuildingCode: string = '';

  constructor(private http: HttpClient) {
    this.selectedBuildingCode = localStorage.getItem('selectedBuildingCode');
  }

  /**
   * Set the currently selected building
   * Called after successful building initialization
   */
  setSelectedBuilding(code: string) {
    this.selectedBuildingCode = code;
    localStorage.setItem('selectedBuildingCode', code);
  }

  /**
   * Get the currently selected building code
   * Used by building overview page to know which building to display
   */
  getSelectedBuilding(): string {
    return this.selectedBuildingCode;
  }

  /**
   * Initialize Building (Onboarding)
   *
   * API: POST /api/buildings/initialize
   *
   * This endpoint:
   * - Checks if building tables exist in database
   * - If not, creates tables and fetches initial data from university API
   * - Returns raw API response for debugging
   *
   * Called by: OnboardingPage.onNext()
   *
   * @param buildingCode - Building code (e.g., 'AP152')
   * @returns API response containing raw_content and metadata
   */
  async initializeBuilding(buildingCode: string): Promise<any> {
    const response = await lastValueFrom(
      this.http.post<any>(`${environment.apiBaseUrl}/buildings/initialize`, { buildingCode })
    );
    this.setSelectedBuilding(buildingCode);
    return response;
  }

  /**
   * Get Current Room Snapshots (Building Overview)
   *
   * API: GET /api/rooms/{building}/now
   *
   * Returns current state of all rooms at a specific date/time:
   * - FREE rooms: with minutes_left, free_until, is_end_of_day
   * - BUSY rooms: with next_slot_free_minutes, availableSoon flag
   *
   * Used by: BuildingOverviewPage.loadData()
   *
   * @param buildingCode - Building code (e.g., 'AP152')
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   * @param time - Optional time in HH:mm:ss format (defaults to now)
   * @returns API response with data array of Room objects
   */
  async getRoomsNow(buildingCode: string, date?: string, time?: string): Promise<any> {
    const url = `${environment.apiBaseUrl}/rooms/${buildingCode}/now`;
    const params: any = {};
    if (date) params.date = date;
    if (time) params.time = time;

    if (Object.keys(params).length > 0) {
      return lastValueFrom(
        this.http.get<any>(url, { params })
      );
    }
    return lastValueFrom(
      this.http.get<any>(url)
    );
  }

  /**
   * Get Full Day Schedule
   *
   * API: GET /api/rooms/{building}/schedule
   *
   * Returns all time slots (FREE and BUSY) for the entire day.
   * Used for:
   * - Room schedule page (timeline view)
   * - Advanced search (finding rooms by future classes)
   *
   * Used by:
   * - BuildingOverviewPage.loadData() (for advanced search)
   * - RoomSchedulePage.loadSchedule() (for timeline display)
   *
   * @param buildingCode - Building code (e.g., 'AP152')
   * @param date - Optional date in YYYY-MM-DD format (defaults to today)
   * @returns API response with data array of RoomSlot objects
   */
  async getSchedule(buildingCode: string, date?: string): Promise<any> {
    const url = `${environment.apiBaseUrl}/rooms/${buildingCode}/schedule`;
    if (date) {
      return lastValueFrom(
        this.http.get<any>(url, { params: { date } })
      );
    }
    return lastValueFrom(
      this.http.get<any>(url)
    );
  }

  // Optional: Trigger global update for all buildings
  async syncAllBuildings(): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(`${environment.apiBaseUrl}/system/sync-all`, {})
    );
  }
}
