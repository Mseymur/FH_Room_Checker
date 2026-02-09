<?php

namespace App\Services;

use App\Models\Building;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RoomScheduleService
{
    private const TIMEZONE = 'Europe/Vienna';
    private const WORKING_DAY_START = '08:00:00';
    private const WORKING_DAY_END = '18:15:00';

    /**
     * Resolve the moment that should be used for querying schedules.
     *
     * @return array{date:string, moment:Carbon}
     */
    public function resolveQueryMoment(?string $date, ?string $time): array
    {
        if ($date) {
            $normalizedTime = $time
                ? (strlen($time) === 5 ? "{$time}:00" : $time)
                : self::WORKING_DAY_START;

            try {
                $moment = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} {$normalizedTime}", self::TIMEZONE);

                return [
                    'date' => $moment->toDateString(),
                    'moment' => $moment,
                ];
            } catch (\Throwable $exception) {
                // Fall back to runtime defaults below.
            }
        }

        $moment = Carbon::now(self::TIMEZONE);

        return [
            'date' => $moment->toDateString(),
            'moment' => $moment,
        ];
    }

    /**
     * Return all schedules for the provided building/date combination.
     */
    public function daySchedules(Building $building, string $date): Collection
    {
        $schedules = $building->rooms()
            ->join('schedules', 'rooms.id', '=', 'schedules.room_id')
            ->whereDate('schedules.start_time', $date)
            ->select(
                'schedules.*',
                'rooms.number as room_number',
                'rooms.floor',
                'rooms.full_code'
            )
            ->orderBy('rooms.floor')
            ->orderBy('rooms.number')
            ->orderBy('schedules.start_time')
            ->get();

        return $schedules->map(function ($slot) use ($building) {
            $slot->building_code = $building->code;

            return $slot;
        });
    }

    /**
     * Produce formatted snapshots of rooms at the provided moment.
     */
    public function currentSnapshots(Building $building, Carbon $moment, ?Collection $daySchedules = null): Collection
    {
        $date = $moment->toDateString();
        $schedules = $daySchedules ?? $this->daySchedules($building, $date);

        return $schedules
            ->filter(fn ($slot) => $this->slotContainsMoment($slot, $moment))
            ->values()
            ->map(fn ($slot) => $this->buildSnapshot($slot, $moment, $schedules, $building->code));
    }

    private function slotContainsMoment($slot, Carbon $moment): bool
    {
        $start = $this->asVienna($slot->start_time);
        $end = $this->asVienna($slot->end_time);

        return $start->lte($moment) && $end->gt($moment);
    }

    private function buildSnapshot($slot, Carbon $moment, Collection $daySchedules, string $buildingCode): array
    {
        $start = $this->asVienna($slot->start_time);
        $end = $this->asVienna($slot->end_time);
        $workingHoursEnd = Carbon::parse("{$moment->toDateString()} " . self::WORKING_DAY_END, self::TIMEZONE);

        $roomSlots = $daySchedules->where('room_id', $slot->room_id)->values();
        $nextSlot = $this->firstSlotAfter($roomSlots, $end);
        // Use inclusive (gte) so we find the BUSY slot that starts exactly when this FREE slot ends (e.g. 11:15)
        $nextBusySlot = $this->firstSlotAfter($roomSlots, $end, 'BUSY', true);

        $freeUntil = null;
        $minutesLeft = 0;
        $nextSlotFreeMinutes = null;
        $isEndOfDay = false;

        if ($slot->status === 'FREE') {
            $targetEnd = $nextBusySlot
                ? $this->minCarbon($this->asVienna($nextBusySlot->start_time), $workingHoursEnd)
                : $workingHoursEnd;

            $freeUntil = $targetEnd->format('H:i');
            $minutesLeft = max(0, $moment->diffInMinutes($targetEnd, false));
            $isEndOfDay = $targetEnd->equalTo($workingHoursEnd);
        } else {
            $targetEnd = $this->minCarbon($end, $workingHoursEnd);
            $freeUntil = $targetEnd->format('H:i');
            $minutesLeft = max(0, $moment->diffInMinutes($end, false));

            if ($nextSlot) {
                $nextStart = $this->asVienna($nextSlot->start_time);
                $effectiveNext = $this->minCarbon($nextStart, $workingHoursEnd);
                $nextSlotFreeMinutes = max(0, $end->diffInMinutes($effectiveNext, false));
            } else {
                $nextSlotFreeMinutes = max(0, $end->diffInMinutes($workingHoursEnd, false));
            }
        }

        return [
            'id' => $slot->status === 'BUSY' ? $slot->external_id : "free_{$slot->id}",
            'title' => $slot->title ?? ($slot->status === 'FREE' ? 'Free Room' : 'Scheduled'),
            'teacher' => $slot->teacher,
            'room_id' => $slot->full_code,
            'room' => $slot->room_number,
            'floor' => $slot->floor,
            'building' => $buildingCode,
            'status' => $slot->status,
            'start' => $start->toIso8601String(),
            'end' => $end->toIso8601String(),
            'free_until' => $freeUntil,
            'minutes_left' => $minutesLeft,
            'next_slot_free_minutes' => $nextSlotFreeMinutes,
            'is_end_of_day' => $isEndOfDay,
            'type' => $slot->status === 'BUSY' ? 'class' : 'free',
            'className' => $slot->class_name ?? null,
        ];
    }

    /**
     * @param bool $inclusive If true, include slots that start exactly at $moment (e.g. next BUSY at 11:15 when free ends 11:15)
     */
    private function firstSlotAfter(Collection $slots, Carbon $moment, ?string $status = null, bool $inclusive = false): ?object
    {
        return $slots
            ->filter(function ($candidate) use ($moment, $status, $inclusive) {
                if ($status && $candidate->status !== $status) {
                    return false;
                }
                $start = $this->asVienna($candidate->start_time);
                return $inclusive ? $start->gte($moment) : $start->gt($moment);
            })
            ->sortBy('start_time')
            ->first();
    }

    private function asVienna($value): Carbon
    {
        if ($value instanceof Carbon) {
            return $value->copy()->setTimezone(self::TIMEZONE);
        }

        $valueString = is_string($value) ? $value : (string) $value;

        return Carbon::createFromFormat('Y-m-d H:i:s', $valueString, self::TIMEZONE);
    }

    private function minCarbon(Carbon $first, Carbon $second): Carbon
    {
        return $first->lessThan($second) ? $first : $second;
    }
}
