<?php

namespace App\Http\Controllers;

use App\Http\Requests\BuildingInitializeRequest;
use App\Services\TimetableFetcher;
use App\Services\TimeslotGenerator;
use App\Models\Building;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

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
            'raw_content' => json_decode($building->rawData->content, true)
        ]);
    }

    public function status()
    {
        $now = Carbon::now('Europe/Vienna');
        $buildings = Building::with('rawData')->get();

        $data = $buildings->map(function ($building) use ($now) {
            $lastSync = $building->rawData?->updated_at;
            $minutesAgo = $lastSync ? $now->diffInMinutes($lastSync) : null;

            return [
                'building' => $building->code,
                'last_synced_at' => $lastSync?->setTimezone('Europe/Vienna')->toDateTimeString(),
                'minutes_ago' => $minutesAgo,
                'hours_ago' => $minutesAgo !== null ? round($minutesAgo / 60, 1) : null,
                'status' => match(true) {
                    $lastSync === null => 'never_synced',
                    $minutesAgo < 130 => 'fresh',
                    $minutesAgo < 360 => 'stale',
                    default => 'very_stale',
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
