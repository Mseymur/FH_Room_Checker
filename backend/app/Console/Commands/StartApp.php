<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TimetableFetcher;
use App\Services\TimeslotGenerator;
use Illuminate\Support\Facades\Artisan;

class StartApp extends Command
{
    // The command you will type: 'php artisan start'
    protected $signature = 'start';

    protected $description = 'Interactive startup: Syncs data and starts the server';

    public function handle(TimetableFetcher $fetcher, TimeslotGenerator $generator)
    {
        $this->info("Welcome to Room Checker Backend!");

        // 1. Interactive Question
        if ($this->confirm('Do you want to fetch and update data for ALL buildings now?', true)) {
            
            // Get list from config (ensure this is defined in config/room_checker.php)
            $buildings = config('room_checker.buildings', []);
            
            if (empty($buildings)) {
                $this->error("No buildings defined in config/room_checker.php!");
                return;
            }

            $this->info("Starting global sync for " . count($buildings) . " buildings...");
            $bar = $this->output->createProgressBar(count($buildings));
            $bar->start();

            foreach ($buildings as $building) {
                try {
                    // Fetch Data
                    $count = $fetcher->sync($building);

                    if ($count > 0) {
                        // Process Data if fetch succeeded
                        $generator->generate($building);
                    } else {
                        // Graceful handling of empty/failed API
                        // We interrupt the progress bar briefly to show a warning
                        $bar->clear();
                        $this->warn("Warning: API returned 0 events for {$building}.");
                        $this->line("  - Database for {$building} remains unchanged.");
                        $bar->display();
                    }

                } catch (\Exception $e) {
                    $bar->clear();
                    $this->error("Error syncing {$building}: " . $e->getMessage());
                    $bar->display();
                }
                
                $bar->advance();
            }

            $bar->finish();
            $this->newLine(2);
            $this->info("Global sync completed.");
            
        } else {
            $this->info("Skipping sync. Using existing database data.");
        }

        // 2. Start the Server
        $this->newLine();
        $this->info("Starting Laravel Server on http://127.0.0.1:8000...");
        $this->info("Press Ctrl+C to stop.");
        
        // Pass through to the standard serve command
        $this->call('serve');
    }
}