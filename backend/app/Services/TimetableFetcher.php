<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Building;
use App\Models\RawData;
use App\Models\Room;
use Carbon\Carbon;

/**
 * TimetableFetcher Service
 *
 * Responsible for communicating with the external University API,
 * downloading the raw JSON, detecting changes via Hashing,
 * and parsing the basic Room structure.
 */
class TimetableFetcher
{
    // Regex to parse "AP152.EG.108" from the event title
    const ROOM_REGEX = '/(AP\d{3})\s+(AP\d{3}\.(?:EG|\d{2})\.\d{3})/';

    public function sync(string $buildingCode)
    {
        // Ensure Building record exists
        $building = Building::firstOrCreate(['code' => $buildingCode]);
        
        $baseUrl = config('room_checker.api_url', env('FHJ_API_URL'));
        if (!$baseUrl) {
            Log::error('Timetable sync failed because FHJ_API_URL is not configured.');
            return 0;
        }

        // Construct URL manually to ensure correct parameter handling
        $fullUrl = $baseUrl . (str_contains($baseUrl, '?') ? '&' : '?') . "submit=Suche&q={$buildingCode}";
        $timeoutSeconds = (int) config('room_checker.http_timeout', 8);

        try {
            // Request with User-Agent spoofing to bypass basic bot filters
            $response = Http::timeout($timeoutSeconds)
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => 'FHJRoomChecker/1.0 (+https://github.com/your-org/fhj-room-checker)',
                ])
                ->get($fullUrl);

            if ($response->failed()) {
                Log::warning("FHJ timetable API responded with {$response->status()} for {$buildingCode}");
                return 0;
            }

            $rawJsonString = $response->body();
            
            // --- HASHING OPTIMIZATION ---
            // Calculate MD5 fingerprint of the new data.
            $newHash = md5($rawJsonString);

            // Compare with the hash stored in the DB.
            $existingRaw = $building->rawData;
            
            if ($existingRaw && $existingRaw->hash === $newHash) {
                Log::info("Hash match for $buildingCode. Skipping processing.");
                return 0;
            }

            // Update Raw Data Archive
            RawData::updateOrCreate(
                ['building_id' => $building->id],
                ['content' => $rawJsonString, 'hash' => $newHash]
            );

            $rawJson = json_decode($rawJsonString, true);
            if (!is_array($rawJson)) {
                Log::warning("FHJ timetable returned invalid JSON for {$buildingCode}");
                return 0;
            }

            // Process the Rooms (static data) from the new JSON
            return $this->processRooms($building, $rawJson);

        } catch (\Exception $e) {
            Log::error("Sync Error for {$buildingCode}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Parses the raw events to find and create unique Room entries.
     */
    private function processRooms(Building $building, array $rawEvents)
    {
        $events = [];
        $ignoredCount = 0;

        foreach ($rawEvents as $rawEvent) {
            if (empty($rawEvent['title'])) continue;

            // Identify Room Code
            if (preg_match(self::ROOM_REGEX, $rawEvent['title'], $matches)) {
                $detectedBuilding = $matches[1]; // "AP152" from the event title
                $fullRoomCode = $matches[2];     // "AP152.01.08"

                // --- STRICT VALIDATION FIX ---
                // Ensure the event actually belongs to the building we are syncing.
                // If we are syncing AP152, but the event says AP147, we SKIP it.
                if ($detectedBuilding !== $building->code) {
                    $ignoredCount++;
                    continue; 
                }
                // -----------------------------

                $parts = explode('.', $fullRoomCode);

                // Idempotent creation of Room
                Room::firstOrCreate(
                    ['full_code' => $fullRoomCode, 'building_id' => $building->id],
                    ['floor' => $parts[1], 'number' => $parts[2]]
                );

                // --- Title Parsing Logic ---
                $eventParts = explode(',', $rawEvent['title']);
                $titleSection = trim($eventParts[0] ?? $rawEvent['title']);
                
                $parenPos = strpos($titleSection, '(');
                $cleanTitle = $parenPos !== false ? trim(substr($titleSection, 0, $parenPos)) : $titleSection;
                
                $teacher = isset($eventParts[1]) ? trim($eventParts[1]) : 'Unknown';

                $events[] = [
                    'external_id' => $rawEvent['id'],
                    'room_code' => $fullRoomCode,
                    'short_title' => $cleanTitle,
                    'teacher' => $teacher,
                    'class_name' => $rawEvent['className'] ?? '',
                    'color' => $rawEvent['color'] ?? '',
                    'start_time' => Carbon::parse($rawEvent['start']),
                    'end_time' => Carbon::parse($rawEvent['end']),
                ];
            }
        }

        if ($ignoredCount > 0) {
            Log::warning("Ignored $ignoredCount events for building {$building->code} because they belonged to other buildings.");
        }

        // Cache processed events in memory for the Generator to pick up
        app()->instance('processed_events_' . $building->code, $events);
        return count($events);
    }
}
