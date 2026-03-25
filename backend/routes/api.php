<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\BuildingController; // Make sure this is included

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// 1. Endpoint for Onboarding/Initialization
Route::middleware('throttle:initialize')->post('/buildings/initialize', [BuildingController::class, 'initialize']);

// 2. The App Endpoint (Filtered for "Now") - Accepts BUILDING CODE
Route::middleware('throttle:rooms')->get('/rooms/{building}/now', [RoomController::class, 'getFreeRoomsNow']);

// 3. Full Schedule Endpoint - Returns all timeslots for a date
Route::middleware('throttle:rooms')->get('/rooms/{building}/schedule', [RoomController::class, 'getSchedule']);

// 4. Diagnostic endpoint - shows when each building's data was last synced
Route::get('/status', [BuildingController::class, 'status']);

// 5. Force sync endpoint - triggers a full re-fetch for all buildings (protected by secret key)
Route::get('/sync', [BuildingController::class, 'forceSync']);