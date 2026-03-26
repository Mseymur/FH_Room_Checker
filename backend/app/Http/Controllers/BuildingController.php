<?php

namespace App\Http\Controllers;

use App\Http\Requests\BuildingInitializeRequest;
use App\Services\TimetableFetcher;
use App\Services\TimeslotGenerator;
use App\Models\Building;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class BuildingController extends Controller
{
    public function initialize(BuildingInitializeRequest $request, TimetableFetcher $fetcher, TimeslotGenerator $generator)
    {
        $code = strtoupper($request->input('buildingCode'));

        // Check if building exists and has raw data
        $building = Building::where('code', $code)->first();
        
        if (!$building || !$building->rawData) {
            $fetcher->sync($code);
            $generator->generate($code);
            $building = Building::where('code', $code)->first();
        }

        if (!$building || !$building->rawData) {
            return response()->json(['status' => 'error', 'message' => 'Fetch failed'], 500);
        }

        return response()->json([
            'status' => 'synced',
            'building' => $building->code,
            'initialized_at' => Carbon::now('Europe/Vienna')->toDateTimeString(),
        ]);
    }

    public function status()
    {
        $now = Carbon::now('Europe/Vienna');
        $buildings = Building::with('rawData')->get();

        $data = $buildings->map(function ($building) use ($now) {
            $lastChange = $building->rawData?->updated_at;
            $check      = Cache::get("sync_check_{$building->code}");

            $lastCheckAt    = $check ? $check['checked_at'] : null;
            $minutesSinceCheck = $lastCheckAt
                ? $now->diffInMinutes(Carbon::parse($lastCheckAt))
                : null;

            return [
                'building'             => $building->code,

                // When data last ACTUALLY CHANGED (hash was different)
                'last_data_change_at'  => $lastChange?->setTimezone('Europe/Vienna')->toDateTimeString(),

                // When the scheduler last ran and CHECKED (even if nothing changed)
                'last_check_at'        => $lastCheckAt,
                'minutes_since_check'  => $minutesSinceCheck,
                'hours_since_check'    => $minutesSinceCheck !== null ? round($minutesSinceCheck / 60, 1) : null,

                // What the last check found
                'last_check_result'    => $check ? ($check['had_change'] ? 'data_changed' : 'no_change') : 'never_checked',
                'last_check_note'      => $check['note'] ?? 'No check recorded yet',

                // Overall freshness based on WHEN THE CHECK HAPPENED (not when data changed)
                'scheduler_status' => match(true) {
                    $minutesSinceCheck === null   => 'never_ran',
                    $minutesSinceCheck < 130      => 'running_ok',
                    $minutesSinceCheck < 360      => 'possibly_stuck',
                    default                       => 'not_running',
                },
            ];
        });

        return response()->json([
            'server_time_vienna' => $now->toDateTimeString(),
            'buildings' => $data,
        ]);
    }

    public function forceSync(Request $request)
    {
        $expected = config('app.sync_secret', env('SYNC_SECRET'));

        if (!$expected || $request->query('key') !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $buildings = config('room_checker.buildings', []);
        $results = [];

        foreach ($buildings as $building) {
            $code = strtoupper($building);
            Artisan::call('timetable:process', ['building' => $code]);
            $results[$code] = trim(Artisan::output());
        }

        return response()->json([
            'status' => 'sync_complete',
            'synced_at' => Carbon::now('Europe/Vienna')->toDateTimeString(),
            'results' => $results,
        ]);
    }
}
