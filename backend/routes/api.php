<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\BuildingController; // Make sure this is included

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// 1. Endpoint for Onboarding/Initialization
Route::post('/buildings/initialize', [BuildingController::class, 'initialize']);

// 2. The App Endpoint (Filtered for "Now") - Accepts BUILDING CODE
Route::get('/rooms/{building}/now', [RoomController::class, 'getFreeRoomsNow']);

// 3. Full Schedule Endpoint - Returns all timeslots for a date
Route::get('/rooms/{building}/schedule', [RoomController::class, 'getSchedule']);