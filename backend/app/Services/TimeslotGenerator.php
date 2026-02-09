<?php

namespace App\Services;

use App\Models\Building;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TimeslotGenerator
{
    public function generate(string $buildingCode)
    {
        $building = Building::where('code', $buildingCode)->first();
        if (!$building) return 0;

        Log::info("Generating Schedule for: $buildingCode");

        // Retrieve cached events
        $cacheKey = 'processed_events_' . $buildingCode;
        if (!app()->bound($cacheKey)) {
            (new TimetableFetcher())->sync($buildingCode);
        }
        if (!app()->bound($cacheKey)) return 0;
        
        $processedEvents = app()->make($cacheKey);

        // Get all rooms for this building
        $rooms = $building->rooms;

        // Group events by Date -> Room
        $eventsByDateAndRoom = collect($processedEvents)
            ->groupBy(fn($event) => $event['start_time']->toDateString())
            ->map(fn($events) => $events->groupBy('room_code'));

        $dayStartStr = config('room_checker.opening_hours_start', '00:00');
        $dayEndStr = config('room_checker.opening_hours_end', '23:59:59');

        // Use the date range implied by the API: from earliest to latest event date.
        // Every day in that range gets schedule rows; days with no events = all rooms free.
        $allDates = $eventsByDateAndRoom->keys();
        if ($allDates->isEmpty()) {
            return 0;
        }
        $minDate = Carbon::parse($allDates->min());
        $maxDate = Carbon::parse($allDates->max());
        $dateRange = [];
        for ($d = $minDate->copy(); $d->lte($maxDate); $d->addDay()) {
            $dateRange[] = $d->toDateString();
        }

        $totalSlots = 0;

        DB::transaction(function () use (&$totalSlots, $eventsByDateAndRoom, $rooms, $dayStartStr, $dayEndStr, $dateRange) {
            foreach ($dateRange as $dateStr) {
                $eventsByRoom = $eventsByDateAndRoom->get($dateStr, collect());
                $dayStart = Carbon::parse("$dateStr $dayStartStr");
                $dayEnd = Carbon::parse("$dateStr $dayEndStr");

                foreach ($rooms as $room) {
                    // Delete old schedule for this room/date
                    Schedule::where('room_id', $room->id)
                        ->whereDate('start_time', $dateStr)
                        ->delete();

                    $events = $eventsByRoom[$room->full_code] ?? collect();
                    $events = $events->sortBy('start_time');

                    $currentPointer = $dayStart->copy();
                    $daySlots = [];

                    if ($events->isEmpty()) {
                        $daySlots[] = $this->createSlot($room->id, $currentPointer, $dayEnd, 'FREE');
                    } else {
                        foreach ($events as $event) {
                            if ($event['start_time'] < $currentPointer) continue;

                            // Gap -> Free
                            if ($event['start_time'] > $currentPointer) {
                                $daySlots[] = $this->createSlot($room->id, $currentPointer, $event['start_time'], 'FREE');
                            }

                            // Class -> Busy
                            $daySlots[] = $this->createSlot($room->id, $event['start_time'], $event['end_time'], 'BUSY', $event);
                            
                            $currentPointer = $event['end_time'];
                        }
                        
                        // End Gap -> Free
                        if ($currentPointer < $dayEnd) {
                            $daySlots[] = $this->createSlot($room->id, $currentPointer, $dayEnd, 'FREE');
                        }
                    }

                    Schedule::insert($daySlots);
                    $totalSlots += count($daySlots);
                }
            }
        });
        
        return $totalSlots;
    }

    private function createSlot($roomId, $start, $end, $status, $data = null)
    {
        return [
            'room_id' => $roomId,
            'start_time' => $start,
            'end_time' => $end,
            'status' => $status,
            'title' => $status === 'FREE' ? 'Free Room' : ($data['short_title'] ?? ''),
            'teacher' => $data['teacher'] ?? null,
            'class_name' => $data['class_name'] ?? null,
            'color' => $status === 'FREE' ? '#28a745' : '#C00C82',
            'external_id' => $data['external_id'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
