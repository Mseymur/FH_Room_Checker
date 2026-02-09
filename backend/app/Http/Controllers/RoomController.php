<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoomQueryRequest;
use App\Http\Resources\RoomScheduleResource;
use App\Http\Resources\RoomSnapshotResource;
use App\Models\Building;
use App\Services\RoomScheduleService;
use Carbon\Carbon;

class RoomController extends Controller
{
    public function __construct(private readonly RoomScheduleService $roomScheduleService)
    {
    }

    public function getFreeRoomsNow(RoomQueryRequest $request, string $code)
    {
        $building = $this->findAllowedBuildingOrFail($code);
        $validated = $request->validated();
        $resolved = $this->roomScheduleService->resolveQueryMoment(
            $validated['date'] ?? null,
            $validated['time'] ?? null
        );

        $snapshots = $this->roomScheduleService->currentSnapshots($building, $resolved['moment']);

        return RoomSnapshotResource::collection($snapshots)
            ->additional([
                'meta' => [
                    'building' => $building->code,
                    'date' => $resolved['date'],
                    'query_time' => $resolved['moment']->toIso8601String(),
                    'count' => $snapshots->count(),
                ],
            ]);
    }

    public function getSchedule(RoomQueryRequest $request, string $code)
    {
        $building = $this->findAllowedBuildingOrFail($code);
        $validated = $request->validated();
        $date = $validated['date'] ?? Carbon::now('Europe/Vienna')->toDateString();

        $schedules = $this->roomScheduleService->daySchedules($building, $date);

        return RoomScheduleResource::collection($schedules)
            ->additional([
                'meta' => [
                    'building' => $building->code,
                    'date' => $date,
                    'count' => $schedules->count(),
                ],
            ]);
    }

    private function findAllowedBuildingOrFail(string $code): Building
    {
        $normalized = strtoupper($code);
        $allowed = collect(config('room_checker.buildings', []))->map(fn ($item) => strtoupper($item));

        abort_unless($allowed->contains($normalized), 404, 'Building not supported.');

        return Building::where('code', $normalized)->firstOrFail();
    }
}
