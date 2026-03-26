<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Log;


// --- 2. BASE COMMANDS (KEEP) ---

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// --- 3. SCHEDULED DATA SYNC ---

// Runs every 2 hours, at minute 0, between 8 AM and 6 PM Vienna Time
Schedule::call(function () {
    Log::info("Starting periodic sync for all buildings...");

    foreach (config('room_checker.buildings', []) as $building) {
        Log::info("-> Syncing $building...");
        Artisan::call('timetable:process', ['building' => $building]);
    }

    Log::info("Periodic sync completed.");
})
    ->cron('0 8-18/2 * * *')
    ->timezone('Europe/Vienna');
    // REMOVED ->runInBackground() to fix the error
