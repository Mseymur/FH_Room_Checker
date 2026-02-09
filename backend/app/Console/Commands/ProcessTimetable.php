<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TimetableFetcher;
use App\Services\TimeslotGenerator;

class ProcessTimetable extends Command
{
    // The signature must accept the building code argument
    protected $signature = 'timetable:process {building}';

    protected $description = 'Fetches raw data for a specific building and generates the timeline';

    public function handle(TimetableFetcher $fetcher, TimeslotGenerator $generator)
    {
        // Must get building from command line
        $building = strtoupper($this->argument('building'));

        $this->info("--------------------------------------");
        $this->info("Step 1: Fetching Data for Building: $building");
        $this->info("--------------------------------------");
        
        // 1. Fetcher checks for updates, creates dynamic rooms table, and caches events
        $eventCount = $fetcher->sync($building); 
        
        if ($eventCount === 0) {
            $this->warn("No new events processed for $building. Data assumed unchanged.");
        } else {
            $this->info("Fetched and processed $eventCount events for $building.");

            $this->info("--------------------------------------");
            $this->info("Step 2: Generating Timeline...");
            $this->info("--------------------------------------");
            
            // 2. Generator reads the cache and creates the dynamic timeslots table
            $slotCount = $generator->generate($building);

            $this->info("Success! Generated $slotCount timeslots in {$building}_timeslots.");
        }
    }
}