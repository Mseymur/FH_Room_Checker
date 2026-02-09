<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomSnapshotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this['id'],
            'title' => $this['title'],
            'teacher' => $this['teacher'],
            'room_id' => $this['room_id'],
            'room' => $this['room'],
            'floor' => $this['floor'],
            'building' => $this['building'],
            'status' => $this['status'],
            'start' => $this['start'],
            'end' => $this['end'],
            'free_until' => $this['free_until'],
            'minutes_left' => $this['minutes_left'],
            'next_slot_free_minutes' => $this['next_slot_free_minutes'],
            'is_end_of_day' => $this['is_end_of_day'],
            'type' => $this['type'],
            'className' => $this['className'],
        ];
    }
}

