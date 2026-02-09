<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomScheduleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->status === 'BUSY' ? $this->external_id : "free_{$this->id}",
            'title' => $this->title ?? ($this->status === 'FREE' ? 'Free Room' : 'Scheduled'),
            'teacher' => $this->teacher,
            'room_id' => $this->full_code,
            'room' => $this->room_number,
            'floor' => $this->floor,
            'building' => $this->building_code,
            'status' => $this->status,
            'start' => $this->formatDate($this->start_time),
            'end' => $this->formatDate($this->end_time),
            'type' => $this->status === 'BUSY' ? 'class' : 'free',
            'className' => $this->class_name ?? null,
        ];
    }

    private function formatDate($value): string
    {
        $time = $value instanceof Carbon
            ? $value->copy()
            : Carbon::parse($value, 'Europe/Vienna');

        return $time->setTimezone('Europe/Vienna')->toIso8601String();
    }
}

