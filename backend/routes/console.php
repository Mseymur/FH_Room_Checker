<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

// --- 1. DEFINITIONS ---

// This list must match the list used in the frontend's BuildingService!
const ALL_BUILDINGS = ['AP152', 'AP147', 'AP149', 'AP154', 'EA11', 'EA9', 'EA13', 'ES30i', 'ES7a', 'ES7b'];


// --- 2. BASE COMMANDS (KEEP) ---

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// --- 3. SCHEDULED DATA SYNC ---

// Runs every 2 hours, at minute 0, between 8 AM and 6 PM Vienna Time
Schedule::call(function () {
    // We use Log::info instead of $this->info because we are inside a closure
    Log::info("Starting periodic sync for all buildings...");
    
    foreach (ALL_BUILDINGS as $building) {
        $rawTableName = strtolower("{$building}_raw");

        // IMPORTANT CHECK: Only run sync if the building has been initialized (i.e., its table exists).
        if (Schema::hasTable($rawTableName)) {
            Log::info("-> Syncing $building...");
            
            // Call the command we defined earlier, passing the building code as the argument.
            Artisan::call('timetable:process', ['building' => $building]);
        }
    }
    Log::info("Periodic sync completed.");
})
    ->cron('0 8-18/2 * * *')
    ->timezone('Europe/Vienna');
    // REMOVED ->runInBackground() to fix the error