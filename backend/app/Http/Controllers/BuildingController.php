<?php

namespace App\Http\Controllers;

use App\Http\Requests\BuildingInitializeRequest;
use App\Services\TimetableFetcher;
use App\Services\TimeslotGenerator;
use App\Models\Building;

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
}
